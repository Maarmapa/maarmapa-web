#!/usr/bin/env node
/**
 * remediate.mjs — Remediación de fichas/cartas rotas en boykot.cl (WooCommerce)
 *
 * SEGURIDAD:
 *  - Lee credenciales SOLO desde variables de entorno. Nunca las escribas aquí.
 *  - Por defecto corre en DRY-RUN (no modifica nada). Usa --apply para escribir.
 *  - Cada cambio se muestra como diff (antes -> después) antes de aplicarse.
 *
 * Variables de entorno requeridas:
 *   WC_STORE_URL        ej: https://www.boykot.cl
 *   WC_CONSUMER_KEY     ck_xxx  (permiso Read/Write)
 *   WC_CONSUMER_SECRET  cs_xxx
 *
 * Uso:
 *   node remediate.mjs list-variations <productId>
 *   node remediate.mjs apply-categories  fixes_categories.csv       [--apply]
 *   node remediate.mjs apply-stock       fixes_stock.csv            [--apply]
 *   node remediate.mjs apply-variation-stock fixes_variation_stock.csv [--apply]
 *
 * Requiere Node >= 18 (fetch nativo). Sin dependencias externas.
 */

import fs from 'node:fs';

const APPLY = process.argv.includes('--apply');
const [, , cmd, fileArg] = process.argv;

const STORE = (process.env.WC_STORE_URL || '').replace(/\/+$/, '');
const CK = process.env.WC_CONSUMER_KEY || '';
const CS = process.env.WC_CONSUMER_SECRET || '';

if (!STORE || !CK || !CS) {
  console.error('✖ Falta configuración. Exporta WC_STORE_URL, WC_CONSUMER_KEY, WC_CONSUMER_SECRET.');
  process.exit(1);
}

const AUTH = 'Basic ' + Buffer.from(`${CK}:${CS}`).toString('base64');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function wc(method, path, body) {
  const res = await fetch(`${STORE}/wp-json/wc/v3${path}`, {
    method,
    headers: { Authorization: AUTH, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${JSON.stringify(json).slice(0, 300)}`);
  return json;
}

// CSV minimalista (soporta campos entre comillas)
function parseCsv(file) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).filter((l) => l.trim());
  const header = splitCsvLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((l) => {
    const cols = splitCsvLine(l);
    return Object.fromEntries(header.map((h, i) => [h, (cols[i] ?? '').trim()]));
  });
}
function splitCsvLine(line) {
  const out = []; let cur = ''; let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) { if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
    else { if (c === '"') q = true; else if (c === ',') { out.push(cur); cur = ''; } else cur += c; }
  }
  out.push(cur); return out;
}

const banner = () => console.log(`\n${APPLY ? '🟢 APPLY (escribiendo cambios)' : '🟡 DRY-RUN (no se modifica nada — usa --apply para ejecutar)'}\n   Tienda: ${STORE}\n`);

async function listVariations(id) {
  const p = await wc('GET', `/products/${id}`);
  console.log(`Producto ${id}: "${p.name}" | tipo: ${p.type} | stock: ${p.stock_status}`);
  if (p.type !== 'variable') return console.log('No es variable; no tiene variaciones.');
  const vars = await wc('GET', `/products/${id}/variations?per_page=100`);
  console.log(`Variaciones (${vars.length}):`);
  for (const v of vars) {
    const attrs = (v.attributes || []).map((a) => `${a.name}:${a.option}`).join(', ');
    console.log(`  ${v.id} | ${attrs || '(sin atributos)'} | stock: ${v.stock_status} | qty: ${v.stock_quantity ?? '-'} | sku: ${v.sku || '-'}`);
  }
}

async function applyCategories(file) {
  // columnas: id, category_ids (separados por |), note
  const rows = parseCsv(file);
  for (const r of rows) {
    if (!r.id || !r.category_ids) { console.log(`· ${r.id || '?'}: sin category_ids, se salta`); continue; }
    const ids = r.category_ids.split('|').map((x) => Number(x.trim())).filter(Boolean);
    const before = await wc('GET', `/products/${r.id}`);
    const beforeCats = (before.categories || []).map((c) => `${c.id}:${c.name}`).join(', ') || '(ninguna)';
    console.log(`#${r.id} "${before.name}"\n   antes: ${beforeCats}\n   después: ${ids.join(', ')}  ${r.note ? '— ' + r.note : ''}`);
    if (APPLY) { await wc('PUT', `/products/${r.id}`, { categories: ids.map((id) => ({ id })) }); console.log('   ✓ aplicado'); await sleep(250); }
  }
}

async function applyStock(file) {
  // columnas: id, stock_status (instock|outofstock|onbackorder), stock_quantity (opcional), note
  const rows = parseCsv(file);
  for (const r of rows) {
    if (!r.id || !r.stock_status) { console.log(`· ${r.id || '?'}: sin stock_status, se salta`); continue; }
    const before = await wc('GET', `/products/${r.id}`);
    const body = { stock_status: r.stock_status };
    if (r.stock_quantity) { body.manage_stock = true; body.stock_quantity = Number(r.stock_quantity); }
    console.log(`#${r.id} "${before.name}"  ${before.stock_status} -> ${r.stock_status}${r.stock_quantity ? ` (qty ${r.stock_quantity})` : ''}  ${r.note ? '— ' + r.note : ''}`);
    if (APPLY) { await wc('PUT', `/products/${r.id}`, body); console.log('   ✓ aplicado'); await sleep(250); }
  }
}

async function applyVariationStock(file) {
  // columnas: product_id, variation_id, stock_status, stock_quantity (opcional), note
  const rows = parseCsv(file);
  for (const r of rows) {
    if (!r.product_id || !r.variation_id || !r.stock_status) { console.log(`· fila incompleta, se salta`); continue; }
    const body = { stock_status: r.stock_status };
    if (r.stock_quantity) { body.manage_stock = true; body.stock_quantity = Number(r.stock_quantity); }
    console.log(`#${r.product_id}/var ${r.variation_id} -> ${r.stock_status}${r.stock_quantity ? ` (qty ${r.stock_quantity})` : ''}  ${r.note ? '— ' + r.note : ''}`);
    if (APPLY) { await wc('PUT', `/products/${r.product_id}/variations/${r.variation_id}`, body); console.log('   ✓ aplicado'); await sleep(250); }
  }
}

(async () => {
  banner();
  try {
    if (cmd === 'list-variations') await listVariations(fileArg);
    else if (cmd === 'apply-categories') await applyCategories(fileArg);
    else if (cmd === 'apply-stock') await applyStock(fileArg);
    else if (cmd === 'apply-variation-stock') await applyVariationStock(fileArg);
    else { console.log('Comandos: list-variations <id> | apply-categories <csv> | apply-stock <csv> | apply-variation-stock <csv>   [--apply]'); }
  } catch (e) {
    console.error('\n✖ Error:', e.message);
    process.exit(1);
  }
})();
