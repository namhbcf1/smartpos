/* Export all components from new-master/js/data into a normalized JSON file.
   Usage:
     node scripts/export-products.js "C:/Users/ADMIN/Desktop/new-master/js/data"
   Output:
     exports/products.json
*/
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const CATEGORY_MAP = {
  cpuData: 'CPU', vgaData: 'GPU', ramData: 'RAM', ssdData: 'SSD', hddData: 'HDD',
  psuData: 'PSU', mainboardData: 'Mainboard', monitorData: 'Monitor', caseData: 'Case',
  cpuCoolerData: 'CPU Cooler'
};

function detectVarName(txt) {
  const keys = Object.keys(CATEGORY_MAP);
  for (const k of keys) if (txt.includes('window.' + k)) return k;
  const m = txt.match(/window\.(\w+)\s*=\s*\{/); if (m) return m[1];
  throw new Error('Cannot detect data var');
}

function loadFile(p) {
  const code = fs.readFileSync(p, 'utf8');
  const varName = detectVarName(code);
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { timeout: 1000 });
  const data = sandbox.window[varName];
  const category = CATEGORY_MAP[varName] || 'Other';
  return { data, category };
}

function cents(v) { const n = Number(v); return Number.isNaN(n) ? 0 : Math.round(n * 100); }

function toProduct(category, code, v) {
  const name = String(v.name || `${category} ${code}`);
  const brand = String(v.brand || 'Unknown');
  const description = [v.socket && `Socket: ${v.socket}`, v.cores && `Cores: ${v.cores}`, v.threads && `Threads: ${v.threads}`, v.technology && `Process: ${v.technology}`, v.capacity && `Capacity: ${v.capacity}`, v.size && `Size: ${v.size}`, v.condition && `Tình trạng: ${v.condition}`, v.warranty && `Bảo hành: ${v.warranty}`].filter(Boolean).join(' | ');
  return {
    id: null, // sẽ tính bên importer nếu cần
    name,
    sku: code,
    barcode: null,
    description,
    price_cents: cents(v.price),
    cost_price_cents: 0,
    stock: 0,
    unit: 'piece',
    category_id: null,
    brand_id: null,
    supplier_id: null,
    store_id: null,
    image_url: v.image || null,
    category_name: category,
    brand_name: brand,
    is_active: 1,
    is_serialized: 0,
    created_at: null,
    updated_at: null,
    tenant_id: 'default'
  };
}

(async () => {
  try {
    const dir = process.argv[2];
    if (!dir) { console.error('Usage: node scripts/export-products.js <path-to-js/data>'); process.exit(1); }
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
    const all = [];
    for (const f of files) {
      const { data, category } = loadFile(path.join(dir, f));
      for (const [code, v] of Object.entries(data)) {
        all.push(toProduct(category, code, v));
      }
    }
    const outDir = path.join(process.cwd(), 'exports');
    fs.mkdirSync(outDir, { recursive: true });
    const out = path.join(outDir, 'products.json');
    fs.writeFileSync(out, JSON.stringify({ items: all }, null, 2), 'utf8');
    console.log(`Exported ${all.length} products -> ${out}`);
  } catch (e) {
    console.error('Export failed:', e.message);
    process.exit(1);
  }
})();