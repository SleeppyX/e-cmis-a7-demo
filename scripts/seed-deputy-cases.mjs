/**
 * Seed เคสคู่ขนานสำหรับคิวรองเลขาธิการฯ (Task 190 — Plan_A7_Deputy_Role) จากชีต "scenario e-cmis" tab Sheet 1 (gid=0)
 * ชีต: https://docs.google.com/spreadsheets/d/1rQ8RVw3Ssv-c7pBV2flczvNaAzIJYkyxi97XcCRQXOU (gid=0)
 *
 * หลักการ (ตกลงกับผู้ใช้ 2026-10-02, Task 183)
 * - เนื้อหาตรงชีตทุกตัวอักษร ต่างแค่เลขสำนวน — ไม่แตะเคสเดิม 0001/0005 (branch ใช้ Supabase ร่วมกับ main และ 0005 ถูก ก8 ใช้ต่อ)
 * - จับแถวจาก "หมายเลขสำนวน" ของเคสคู่ — แถว 58/2 ไม่มีเลขสำนวน จึงจับจาก "เลขรับเรื่องร้องเรียน" แทน
 *   แล้วใช้การแมปช่องเดียวกับ seed-scenario-cases.mjs
 * - 9501/2569 ← สำนวน 0001/2569        สาย 7.1  สถานะ 004 (PENDING_DEPUTY)     ม.18/1 (ก) ไต่สวนเบื้องต้น
 *   9505/2569 ← สำนวน 0005/2569        สาย 7.2  สถานะ 102 (PENDING_DEPUTY_72)  ม.18/1 (ก) ถึงขั้นชี้มูล
 *   9507/2569 ← เลขรับเรื่อง 0007/2569  สาย 7.3  สถานะ 004 (PENDING_DEPUTY)     ม.58/2 มาตรการบริหาร ไม่ไต่สวน → เรื่องทั่วไป
 *
 * Run:  node board-resolution/scripts/seed-deputy-cases.mjs            (ตรวจอย่างเดียว)
 *       node board-resolution/scripts/seed-deputy-cases.mjs --apply    (เขียน DB แล้วตรวจซ้ำ)
 *       เพิ่ม --reset เพื่อคืนเคสคู่ขนานกลับสถานะรอรองเลขาฯ (004/102) และล้างความเห็น/การตีกลับของรองเลขาฯ
 * ต้องการ: Node 18+ (fetch)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SHEET_CSV = 'https://docs.google.com/spreadsheets/d/1rQ8RVw3Ssv-c7pBV2flczvNaAzIJYkyxi97XcCRQXOU/export?format=csv&gid=0';
const APPLY = process.argv.includes('--apply');
const RESET = process.argv.includes('--reset');

const TARGETS = [
  { by: 'หมายเลขสำนวน', key: '0001/2569', no: '9501/2569', procType: '7.1', status: '004', docType: '213' },
  { by: 'หมายเลขสำนวน', key: '0005/2569', no: '9505/2569', procType: '7.2', status: '102', docType: '644' },
  { by: 'เลขรับเรื่องร้องเรียน', key: '0007/2569', no: '9507/2569', procType: '7.3', status: '004', docType: '213' }
];
const DEPUTY_KEYS = ['deputyOpinion', 'deputySignedAt', 'deputySignedAtIso', 'deputyName', 'deputyReturn', 'sourceReturn'];

const here = path.dirname(fileURLToPath(import.meta.url));
const appJs = fs.readFileSync(path.join(here, '../assets/ecmis-app.js'), 'utf8');
const SB_URL = (appJs.match(/DEFAULT_SUPABASE_URL\s*=\s*'([^']+)'/) || [])[1];
const SB_KEY = (appJs.match(/DEFAULT_SUPABASE_KEY\s*=\s*'([^']+)'/) || [])[1];
if (!SB_URL || !SB_KEY) throw new Error('อ่านค่า Supabase จาก assets/ecmis-app.js ไม่ได้');

async function sb(p, opt = {}) {
  const r = await fetch(`${SB_URL}/rest/v1/${p}`, {
    ...opt,
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json',
      Prefer: 'return=representation', ...(opt.headers || {}) }
  });
  const t = await r.text();
  let data; try { data = JSON.parse(t); } catch { data = t; }
  return { ok: r.ok, data };
}
async function must(label, p) {
  const r = await p;
  if (!r.ok || !Array.isArray(r.data) || !r.data.length) throw new Error(`${label} ไม่สำเร็จ: ${JSON.stringify(r.data)}`);
  return r.data;
}

/* CSV parser (รองรับ "…", "" และขึ้นบรรทัดในเซลล์) — เหมือน seed-scenario-cases.mjs */
function parseCsv(text) {
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (ch !== '\r') cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
function toIsoDate(v) {
  const s = String(v || '').trim();
  if (!s) return null;
  let y, m, d, mt;
  if ((mt = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) [, y, m, d] = mt;
  else if ((mt = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))) [, d, m, y] = mt;
  else throw new Error(`รูปแบบวันที่ในชีตไม่รองรับ: "${s}"`);
  y = +y; if (y > 2400) y -= 543;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

const rows = parseCsv(await (await fetch(SHEET_CSV)).text());
const hi = rows.findIndex(r => r.some(c => c.trim() === 'หมายเลขสำนวน'));
if (hi < 0) throw new Error('ไม่พบหัวตาราง "หมายเลขสำนวน" ในชีต');
const H = rows[hi].map(h => h.trim());
const col = (row, test) => { const i = H.findIndex(test); return i < 0 ? undefined : (row[i] ?? '').trim(); };
const has = test => H.findIndex(test) >= 0;
const isPos = h => h.includes('ตำแหน่ง');
const isAgency = h => h.includes('หน่วยงาน') && !h.includes('ศรร') && !h.includes('กอง');
const isRecv = h => h.includes('วันที่รับ');
const body = rows.slice(hi + 1).filter(r => r.some(c => c.trim()));

let diffs = 0;
for (const t of TARGETS) {
  const r = body.find(x => col(x, h => h === t.by) === t.key);
  if (!r) { console.log(`\n✗ ไม่พบแถว ${t.by} ${t.key} ในชีต — ข้าม ${t.no}`); diffs++; continue; }
  const subj = col(r, h => h === 'เรื่องที่ร้องเรียน');
  const caseFields = {
    tcc_subject: subj,
    tcc_allegation: subj,
    tcc_complainant: col(r, h => h === 'ชื่อผู้ร้องเรียน'),
    tcc_legal_base: col(r, h => h === 'มาตรา'),
    tcc_doc_ref: col(r, h => h.startsWith('เลขสารบัญของ ศรร')),
    tcc_owner: col(r, h => h === 'ธุรการคดี'),
  };
  if (has(isRecv)) caseFields.tcc_received_date = toIsoDate(col(r, isRecv));
  const accFields = { tcca_name: col(r, h => h === 'ผู้ถูกร้องเรียน') };
  if (has(isPos)) accFields.tcca_position = col(r, isPos);
  if (has(isAgency)) accFields.tcca_agency = col(r, isAgency);
  const source = {
    sheet: 'scenario e-cmis (กิจกรรมที่ 4)', parallelOf: col(r, h => h === 'หมายเลขสำนวน') || '(ไม่มีเลขสำนวน)',
    เลขรับเรื่องร้องเรียน: col(r, h => h === 'เลขรับเรื่องร้องเรียน'),
    เลขติดตาม: col(r, h => h === 'เลขติดตาม'),
    PIN: col(r, h => h.startsWith('รหัสติดตาม')),
    เลขสารบัญของศรร: caseFields.tcc_doc_ref,
  };

  const cur = ((await sb(`tbl_cmp_case?select=*&tcc_no=eq.${encodeURIComponent(t.no)}`)).data || [])[0] || null;
  const curAcc = cur ? ((await sb(`tbl_cmp_case_accused?select=*&tcc_id=eq.${cur.tcc_id}&is_deleted=eq.false&order=tcca_no`)).data || [])[0] : null;
  const curReq = cur ? ((await sb(`tbl_res_request?select=*&tcc_id=eq.${cur.tcc_id}&is_deleted=eq.false`)).data || [])[0] : null;
  console.log(`\n=== ${t.no} ← ${t.by} ${t.key} (สาย ${t.procType}) — ${cur ? `มีอยู่แล้ว สถานะ ${curReq ? curReq.trr_status : '—'}` : `ยังไม่มี (สร้างใหม่ สถานะ ${t.status})`}`);
  const cmp = (label, want, have) => { if ((have ?? null) !== (want ?? null)) { diffs++; console.log(`  ≠ ${label}\n      ชีต: ${JSON.stringify(want)}\n      DB : ${JSON.stringify(have ?? null)}`); } };
  for (const [k, v] of Object.entries(caseFields)) cmp(k, v, cur && cur[k]);
  for (const [k, v] of Object.entries(accFields)) cmp(k, v, curAcc && curAcc[k]);
  cmp('tcc_doc_type', t.docType, cur && cur.tcc_doc_type);
  const rd = (curReq && curReq.trr_resolution_data) || {};
  cmp('trr_resolution_data.procType', t.procType, rd.procType);

  if (!APPLY) continue;
  let tccId = cur && cur.tcc_id;
  if (cur) await must(`แก้ ${t.no}`, sb(`tbl_cmp_case?tcc_id=eq.${tccId}`, { method: 'PATCH', body: JSON.stringify({ ...caseFields, tcc_doc_type: t.docType }) }));
  else tccId = (await must(`สร้าง ${t.no}`, sb('tbl_cmp_case', { method: 'POST',
    body: JSON.stringify({ tcc_no: t.no, tcc_doc_type: t.docType, tcc_urgent: false, tcc_complex: false, is_deleted: false, ...caseFields }) })))[0].tcc_id;
  if (curAcc) await must(`แก้ผู้ถูกร้อง ${t.no}`, sb(`tbl_cmp_case_accused?tcca_id=eq.${curAcc.tcca_id}`, { method: 'PATCH', body: JSON.stringify(accFields) }));
  else await must(`เพิ่มผู้ถูกร้อง ${t.no}`, sb('tbl_cmp_case_accused', { method: 'POST', body: JSON.stringify({ tcc_id: tccId, tcca_no: 1, is_deleted: false, ...accFields }) }));
  const newRd = { ...rd, procType: t.procType, scenarioSource: source };
  if (RESET) DEPUTY_KEYS.forEach(k => delete newRd[k]);
  if (curReq) {
    const patch = { trr_resolution_data: newRd };
    if (RESET) patch.trr_status = t.status;
    await must(`แก้คำขอ ${t.no}`, sb(`tbl_res_request?trr_id=eq.${curReq.trr_id}`, { method: 'PATCH', body: JSON.stringify(patch) }));
  } else {
    await must(`สร้างคำขอ ${t.no}`, sb('tbl_res_request', { method: 'POST', body: JSON.stringify({
      tcc_id: tccId, trr_status: t.status, trr_urgent: false, trr_signed_secgen: false, is_deleted: false,
      trr_resolution_data: newRd }) }));
  }
  const after = (await sb(`tbl_cmp_case?select=*&tcc_id=eq.${tccId}`)).data[0];
  const afterReq = (await sb(`tbl_res_request?select=*&tcc_id=eq.${tccId}&is_deleted=eq.false`)).data[0];
  const bad = Object.entries(caseFields).filter(([k, v]) => after[k] !== v).map(([k]) => k);
  console.log(bad.length ? `  ✗ หลังเขียนยังไม่ตรง: ${bad.join(', ')}` : `  ✓ เขียนแล้ว ตรงชีตทุกช่อง · สถานะ ${afterReq.trr_status} · สาย ${afterReq.trr_resolution_data?.procType}`);
}
console.log(`\n${APPLY ? 'เขียน DB แล้ว' : 'โหมดตรวจ (ยังไม่เขียน DB) — ใช้ --apply เพื่อเขียน'} | ช่องที่ไม่ตรงก่อนรัน: ${diffs}`);
