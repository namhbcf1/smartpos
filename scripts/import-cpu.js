/* Generic importer for js/data/*.js into D1 products
   Usage:
     node scripts/import-cpu.js "C:/path/to/js/data/cpu.js"
*/
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const DATABASE_ID = process.env.CLOUDFLARE_D1_DATABASE_ID || process.env.CLOUDFLARE_D1_DATABASE || process.env.CLOUDFLARE_D1_DATABASEID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

if (!ACCOUNT_ID || !DATABASE_ID || !API_TOKEN) {
  console.error('Missing Cloudflare credentials. Set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID, CLOUDFLARE_API_TOKEN');
  process.exit(1);
}

const INPUT = process.argv[2];
if (!INPUT) {
  console.error('Usage: node scripts/import-cpu.js "C:/path/to/js/data/<file>.js"');
  process.exit(1);
}

const CATEGORY_MAP = {
  cpuData: 'CPU', vgaData: 'GPU', ramData: 'RAM', ssdData: 'SSD', hddData: 'HDD',
  psuData: 'PSU', mainboardData: 'Mainboard', monitorData: 'Monitor', caseData: 'Case',
  cpuCoolerData: 'CPU Cooler'
};

function detectVarName(sourceText) {
  const keys = Object.keys(CATEGORY_MAP);
  for (const k of keys) if (sourceText.includes('window.' + k)) return k;
  const m = sourceText.match(/window\.(\w+)\s*=\s*\{/); if (m) return m[1];
  throw new Error('Could not detect data variable name in file');
}

function stableId(cat, code) { return crypto.createHash('sha1').update(`${cat}:${code}`).digest('hex'); }
function cents(v) { const n = Number(v); return Number.isNaN(n) ? 0 : Math.round(n * 100); }
function norm(t) { return t == null ? null : String(t); }

function fallbackParseObject(text, varName) {
  // Extract right-hand object of window.varName = { ... } and JSON-parse after cleaning
  const re = new RegExp(`window\\.${varName}\\s*=\\s*\\{`);
  const startMatch = text.match(re);
  if (!startMatch) throw new Error('fallback: start not found');
  const startIdx = startMatch.index + startMatch[0].length - 1; // at the '{'
  // find matching closing brace
  let depth = 0; let end = -1;
  for (let i = startIdx; i < text.length; i++) {
    const ch = text[i];
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end === -1) throw new Error('fallback: end not found');
  let objText = text.slice(startIdx, end + 1);
  // remove comments
  objText = objText.replace(/\/\/.*(?=\n)/g, '');
  objText = objText.replace(/\/\*[\s\S]*?\*\//g, '');
  // remove trailing commas
  objText = objText.replace(/,\s*(\}|\])/g, '$1');
  return JSON.parse(objText);
}

function extractData(p) {
  const code = fs.readFileSync(p, 'utf8');
  const varName = detectVarName(code);
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  try {
    vm.runInContext(code, sandbox, { timeout: 1000 });
    const data = sandbox.window[varName];
    if (!data) throw new Error('Data not found in VM');
    const category = CATEGORY_MAP[varName] || 'Other';
    return { data, category };
  } catch (e) {
    // Fallback for files referencing undefined local symbol at the end (e.g., mainboardData is not defined)
    const data = fallbackParseObject(code, varName);
    const category = CATEGORY_MAP[varName] || 'Other';
    return { data, category };
  }
}

async function d1Raw(sql) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/raw`;
  const res = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${API_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ sql }) });
  const data = await res.json();
  if (!data.success) throw new Error('D1: ' + JSON.stringify(data.errors || data));
  return data;
}

(async () => {
  try {
    const { data, category } = extractData(INPUT);
    const now = new Date().toISOString();
    const sqls = [];
    for (const [code, v] of Object.entries(data)) {
      const id = stableId(category, code);
      const name = norm(v.name) || `${category} ${code}`;
      const brand = norm(v.brand) || 'Unknown';
      const parts = [v.socket && `Socket: ${v.socket}`, Array.isArray(v.sockets) && v.sockets.length && `Sockets: ${v.sockets.join('/')}`, v.cores && `Cores: ${v.cores}`, v.threads && `Threads: ${v.threads}`, v.technology && `Process: ${v.technology}`, v.capacity && `Capacity: ${v.capacity}`, v.size && `Size: ${v.size}`, v.memoryType && `RAM: ${v.memoryType}`, v.buss && `Bus: ${v.buss}`, v.condition && `Tình trạng: ${v.condition}`, v.warranty && `Bảo hành: ${v.warranty}`].filter(Boolean);
      const desc = parts.join(' | ').replace(/'/g, "''");
      const price = cents(v.price);
      const img = v.image ? `'${v.image}'` : 'NULL';
      const sql = `INSERT INTO products (id, name, sku, barcode, description, price_cents, cost_price_cents, stock, unit, category_id, brand_id, supplier_id, store_id, image_url, category_name, brand_name, is_active, is_serialized, created_at, updated_at, tenant_id)
VALUES ('${id}', '${name.replace(/'/g, "''")}', '${code}', NULL, '${desc}', ${price}, 0, 0, 'piece', NULL, NULL, NULL, NULL, ${img}, '${category}', '${brand.replace(/'/g, "''")}', 1, 0, '${now}', '${now}', 'default')
ON CONFLICT(id) DO UPDATE SET name=excluded.name, description=excluded.description, price_cents=excluded.price_cents, image_url=excluded.image_url, brand_name=excluded.brand_name, updated_at='${now}';`;
      sqls.push(sql);
    }
    const chunk = 50; let idx = 0;
    for (let i = 0; i < sqls.length; i += chunk) {
      const body = sqls.slice(i, i + chunk).join('\n');
      await d1Raw(body); idx++;
      console.log(`chunk ${idx} ok`);
    }
    console.log(`Imported ${sqls.length} items for category ${category}`);
  } catch (e) {
    console.error('Import failed:', e.message);
    process.exit(1);
  }
})();