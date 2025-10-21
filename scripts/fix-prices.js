/* Fix prices in D1 products for VND display.
   Rule: divide all price_cents by 100 (convert old VND*100 to VND) for tenant 'default'.
   Usage:
     node scripts/fix-prices.js
*/
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const DATABASE_ID = process.env.CLOUDFLARE_D1_DATABASE_ID || process.env.CLOUDFLARE_D1_DATABASE || process.env.CLOUDFLARE_D1_DATABASEID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

if (!ACCOUNT_ID || !DATABASE_ID || !API_TOKEN) {
  console.error('Missing Cloudflare credentials');
  process.exit(1);
}

async function d1Raw(sql){
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/raw`,{
    method:'POST', headers:{Authorization:`Bearer ${API_TOKEN}`,'Content-Type':'application/json'}, body:JSON.stringify({sql})
  });
  const data = await res.json(); if(!data.success) throw new Error(JSON.stringify(data.errors||data,null,2)); return data;
}

(async()=>{
  try{
    const now = new Date().toISOString();
    // Always divide by 100 for tenant default
    await d1Raw(`UPDATE products SET price_cents = CAST(price_cents/100 AS INTEGER), updated_at='${now}' WHERE COALESCE(tenant_id,'default')='default'`);
    console.log('All prices divided by 100.');
    const sample = await d1Raw("SELECT name, price_cents FROM products WHERE COALESCE(tenant_id,'default')='default' ORDER BY updated_at DESC LIMIT 10");
    console.log('Sample after fix:', JSON.stringify(sample.result?.[0]?.results || [], null, 2));
  }catch(e){
    console.error('Fix failed:', e.message);
    process.exit(1);
  }
})();