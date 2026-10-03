/**
 * Seed/ซิงก์เคสตาม "scenario e-cmis" (ชีต Case กลาง) ลงฐานข้อมูลของ กจ.7 ให้ตรงชีตทุกตัวอักษร
 * ชีต: https://docs.google.com/spreadsheets/d/1rQ8RVw3Ssv-c7pBV2flczvNaAzIJYkyxi97XcCRQXOU (gid=0)
 *
 * หลักการ (ตกลงกับผู้ใช้ 2026-10-02, Task 167)
 * - อ่านชีตใหม่ทุกครั้งที่รัน — ไม่มีค่าที่พิมพ์ไว้ในสคริปต์ แก้ชีตแล้วรันซ้ำได้
 * - เขียนเฉพาะช่องที่ชีตมี; ช่องที่ชีตไม่มีจะไม่ถูกแต่งเติม (เคสใหม่ = ว่าง, เคสเดิม = คงค่าเดิม)
 * - แถวที่ไม่มีเลขสำนวน (เช่น "ไม่มีเลขสำนวน") ไม่เข้า กจ.7 — ข้าม
 * - เคสใหม่เริ่มสาย 7.1 สถานะรอเลขาธิการฯ ลงนาม (005); เคสเดิมไม่เปลี่ยนสถานะ (เว้นแต่สั่ง --reset)
 * - เลขของกิจกรรมที่ 4 ที่ตาราง กจ.7 ไม่มีช่องรองรับ เก็บใน trr_resolution_data.scenarioSource (ไม่แสดงบนจอ)
 *
 * Run:  node board-resolution/scripts/seed-scenario-cases.mjs            (ตรวจอย่างเดียว — แสดงช่องที่ไม่ตรง)
 *       node board-resolution/scripts/seed-scenario-cases.mjs --apply    (เขียน DB แล้วตรวจซ้ำทุกช่อง)
 *       เพิ่ม --reset เพื่อคืนเคสใหม่กลับสถานะ 005
 * ต้องการ: Node 18+ (fetch)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SHEET_CSV = 'https://docs.google.com/spreadsheets/d/1rQ8RVw3Ssv-c7pBV2flczvNaAzIJYkyxi97XcCRQXOU/export?format=csv&gid=0';
const APPLY = process.argv.includes('--apply');
const RESET = process.argv.includes('--reset');

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

/* CSV parser (รองรับ "…", "" และขึ้นบรรทัดในเซลล์) */
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

/* วันที่จากชีต → ISO ค.ศ. (DB เก็บ ค.ศ.) รองรับ yyyy-mm-dd และ d/m/yyyy ทั้ง พ.ศ./ค.ศ. */
function toIsoDate(v) {
  const s = String(v || '').trim();
  if (!s) return null;
  let y, m, d, mt;
  if ((mt = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/))) [, y, m, d] = mt;
  else if ((mt = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))) [, d, m, y] = mt;
  else throw new Error(`รูปแบบวันที่ในชีตไม่รองรับ: "${s}" (ใช้ yyyy-mm-dd หรือ d/m/yyyy)`);
  y = +y; if (y > 2400) y -= 543;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

const text = await (await fetch(SHEET_CSV)).text();
const rows = parseCsv(text);
const hi = rows.findIndex(r => r.some(c => c.trim() === 'หมายเลขสำนวน'));
if (hi < 0) throw new Error('ไม่พบหัวตาราง "หมายเลขสำนวน" ในชีต');
const H = rows[hi].map(h => h.trim());
const col = (row, test) => { const i = H.findIndex(test); return i < 0 ? undefined : (row[i] ?? '').trim(); };
const has = test => H.findIndex(test) >= 0;

const isPos = h => h.includes('ตำแหน่ง');
const isAgency = h => h.includes('หน่วยงาน') && !h.includes('ศรร') && !h.includes('กอง');
const isRecv = h => h.includes('วันที่รับ');
console.log(`ชีต: ${rows.length} แถว | หัวตาราง: ${H.filter(Boolean).join(' / ')}`);
console.log(`คอลัมน์เสริม — ตำแหน่ง: ${has(isPos) ? 'มี' : 'ไม่มี'}, หน่วยงาน: ${has(isAgency) ? 'มี' : 'ไม่มี'}, วันที่รับเรื่อง: ${has(isRecv) ? 'มี' : 'ไม่มี'}`);

let diffs = 0;
for (const r of rows.slice(hi + 1)) {
  if (!r.some(c => c.trim())) continue;
  const no = col(r, h => h === 'หมายเลขสำนวน');
  const subj = col(r, h => h === 'เรื่องที่ร้องเรียน');
  if (!/^\d{4}\/\d{4}$/.test(no || '')) { console.log(`\n— ข้าม "${subj}" (หมายเลขสำนวน: ${no || 'ว่าง'})`); continue; }

  const caseFields = {
    tcc_subject: subj,
    tcc_allegation: subj,
    tcc_complainant: col(r, h => h === 'ชื่อผู้ร้องเรียน'),
    tcc_legal_base: col(r, h => h === 'มาตรา'),
    tcc_doc_ref: col(r, h => h.startsWith('เลขสารบัญของ ศรร')),
    tcc_owner: col(r, h => h === 'ธุรการคดี'),
  };
  if (has(isRecv)) caseFields.tcc_received_date = toIsoDate(col(r, isRecv));
  const accName = col(r, h => h === 'ผู้ถูกร้องเรียน');
  const accFields = { tcca_name: accName };
  if (has(isPos)) accFields.tcca_position = col(r, isPos);
  if (has(isAgency)) accFields.tcca_agency = col(r, isAgency);
  const source = {
    sheet: 'scenario e-cmis (กิจกรรมที่ 4)',
    เลขรับเรื่องร้องเรียน: col(r, h => h === 'เลขรับเรื่องร้องเรียน'),
    เลขติดตาม: col(r, h => h === 'เลขติดตาม'),
    PIN: col(r, h => h.startsWith('รหัสติดตาม')),
    เลขสารบัญของศรร: caseFields.tcc_doc_ref,
    เจ้าหน้าที่รับเรื่องศรร: col(r, h => h.startsWith('เจ้าหน้าที่รับเรื่อง')),
    ผอศรร: col(r, h => h === 'ผอ.ศรร.'),
    ผอกองบริหารคดี: col(r, h => h === 'ผอ.กองบริหารคดี'),
    เลขสารบัญขาออกศรร: col(r, h => h.startsWith('เลขสารบัญขาออก')),
    เลขสารบัญกองบริหารคดี: col(r, h => h === 'เลขสารบัญ กองบริหารคดี'),
  };

  const ex = (await sb(`tbl_cmp_case?select=*&tcc_no=eq.${encodeURIComponent(no)}`)).data || [];
  const cur = ex[0] || null;
  const curAcc = cur ? ((await sb(`tbl_cmp_case_accused?select=*&tcc_id=eq.${cur.tcc_id}&is_deleted=eq.false&order=tcca_no`)).data || [])[0] : null;
  const curReq = cur ? ((await sb(`tbl_res_request?select=*&tcc_id=eq.${cur.tcc_id}&is_deleted=eq.false`)).data || [])[0] : null;

  console.log(`\n=== ${no} — ${cur ? 'มีอยู่แล้ว (แก้ให้ตรงชีต)' : 'ยังไม่มี (สร้างใหม่ สาย 7.1 สถานะ 005)'}`);
  const cmp = (label, want, have) => { if ((have ?? null) !== (want ?? null)) { diffs++; console.log(`  ≠ ${label}\n      ชีต: ${JSON.stringify(want)}\n      DB : ${JSON.stringify(have ?? null)}`); } };
  for (const [k, v] of Object.entries(caseFields)) cmp(k, v, cur && cur[k]);
  for (const [k, v] of Object.entries(accFields)) cmp(k, v, curAcc && curAcc[k]);
  const rd = (curReq && curReq.trr_resolution_data) || {};
  if (rd.discCharge72 !== undefined) cmp('trr_resolution_data.discCharge72 (ข้อความส่ง กจ.8)', subj, rd.discCharge72);
  if (rd.discAccused72 !== undefined) cmp('trr_resolution_data.discAccused72', accName, rd.discAccused72);
  /* JSONB เรียงชื่อช่องใหม่ — เทียบแบบเรียงคีย์ก่อน ไม่ให้ลำดับช่องทำให้ดูเหมือนไม่ตรง */
  const sorted = o => o && JSON.stringify(Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b))));
  cmp('trr_resolution_data.scenarioSource', sorted(source), sorted(rd.scenarioSource));

  if (!APPLY) continue;
  let tccId = cur && cur.tcc_id;
  if (cur) await must(`แก้ ${no}`, sb(`tbl_cmp_case?tcc_id=eq.${tccId}`, { method: 'PATCH', body: JSON.stringify(caseFields) }));
  else tccId = (await must(`สร้าง ${no}`, sb('tbl_cmp_case', { method: 'POST',
    body: JSON.stringify({ tcc_no: no, tcc_doc_type: '213', tcc_urgent: false, tcc_complex: false, is_deleted: false, ...caseFields }) })))[0].tcc_id;
  if (curAcc) await must(`แก้ผู้ถูกร้อง ${no}`, sb(`tbl_cmp_case_accused?tcca_id=eq.${curAcc.tcca_id}`, { method: 'PATCH', body: JSON.stringify(accFields) }));
  else await must(`เพิ่มผู้ถูกร้อง ${no}`, sb('tbl_cmp_case_accused', { method: 'POST', body: JSON.stringify({ tcc_id: tccId, tcca_no: 1, is_deleted: false, ...accFields }) }));
  const newRd = { ...rd, scenarioSource: source };
  if (rd.discCharge72 !== undefined) newRd.discCharge72 = subj;
  if (rd.discAccused72 !== undefined) newRd.discAccused72 = accName;
  if (curReq) {
    const patch = { trr_resolution_data: newRd };
    if (RESET && !cur) patch.trr_status = '005';
    await must(`แก้คำขอ ${no}`, sb(`tbl_res_request?trr_id=eq.${curReq.trr_id}`, { method: 'PATCH', body: JSON.stringify(patch) }));
  } else {
    await must(`สร้างคำขอ ${no}`, sb('tbl_res_request', { method: 'POST', body: JSON.stringify({
      tcc_id: tccId, trr_status: '005', trr_urgent: false, trr_signed_secgen: false, is_deleted: false,
      trr_resolution_data: { procType: '7.1', ...newRd } }) }));
  }
  /* ตรวจซ้ำจาก DB ทุกช่อง */
  const after = (await sb(`tbl_cmp_case?select=*&tcc_id=eq.${tccId}`)).data[0];
  const afterAcc = (await sb(`tbl_cmp_case_accused?select=*&tcc_id=eq.${tccId}&is_deleted=eq.false&order=tcca_no`)).data[0];
  const bad = [...Object.entries(caseFields).filter(([k, v]) => after[k] !== v), ...Object.entries(accFields).filter(([k, v]) => afterAcc[k] !== v)];
  console.log(bad.length ? `  ✗ หลังเขียนยังไม่ตรง: ${bad.map(([k]) => k).join(', ')}` : '  ✓ เขียนแล้ว ตรงชีตทุกช่อง');
}
console.log(`\n${APPLY ? 'เขียน DB แล้ว' : 'โหมดตรวจ (ยังไม่เขียน DB) — ใช้ --apply เพื่อเขียน'} | ช่องที่ไม่ตรงก่อนรัน: ${diffs}`);
