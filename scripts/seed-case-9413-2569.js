/**
 * Seed/Reset เคสเดโม 7.3 ด่วน 9413/2569 (เรื่องทั่วไป/กกม. มีใบด่วนมาแต่ต้น) ให้เริ่มที่ขั้นเลขาธิการฯ (005)
 * flow: เลขาฯ → ผอ.กบค. (เหตุผลด่วน) → เลขาฯ ยืนยัน → ประธานฯ → บรรจุวาระ
 * (tcc_doc_type/tcc_legal_base มี CHECK ใส่ GENERAL/นโยบายไม่ได้ — ระบุสายผ่าน trr_resolution_data.procType='7.3' ซึ่ง supabaseRowToCase spread เข้า kase)
 * แถว 9413/2569 ใน DB เคยถูกใช้ทดสอบ (soft-delete) — สคริปต์นี้ "คืนชีพ" แถวเดิมและรีเซ็ต (DELETE ของ anon key ไม่มีผลจริง)
 * Run: node scripts/seed-case-9413-2569.js   (รันซ้ำ = รีเซ็ตกลับจุดเริ่มต้น)
 */
const { sbFetch } = require('./lib/supabase-rest');
const NO = '9413/2569';
async function must(label, p) {
  const r = await p;
  if (!r.ok || !Array.isArray(r.data) || r.data.length < 1) throw new Error(`${label} failed: ${JSON.stringify(r.data)}`);
  return r.data;
}
(async () => {
  const caseFields = {
    tcc_subject: 'บันทึกขอความเห็นชอบดำเนินการเร่งด่วนเรื่องการบริหารจัดการข้อร้องเรียนค้างพิจารณา (เรื่องทั่วไป — เคสเดโม 7.3 ด่วน)',
    tcc_allegation: 'ขอความเห็นชอบเรื่องทั่วไปที่มีกำหนดเวลาเร่งด่วน ต้องบรรจุวาระการประชุมคณะกรรมการ ป.ป.ท. ครั้งถัดไป',
    tcc_legal_base: 'ม.18/4', tcc_complainant: 'กองบริหารคดี (กจ.)',
    tcc_owner: 'นายทดสอบ ระบบ (นิติกรชำนาญการ)', tcc_owner_org: 'กองบริหารคดี',
    tcc_received_date: '2026-09-29', tcc_prescription_date: '2029-09-29', tcc_doc_ref: 'ปป 0021/9413',
    tcc_doc_type: null, tcc_urgent: true, tcc_complex: false, is_deleted: false
  };
  let c = (await sbFetch(`tbl_cmp_case?select=tcc_id&tcc_no=eq.${encodeURIComponent(NO)}`)).data || [];
  let tccId;
  if (c.length) {
    tccId = c[0].tcc_id;
    await must('patch case', sbFetch(`tbl_cmp_case?tcc_id=eq.${tccId}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(caseFields) }));
  } else {
    tccId = (await must('insert case', sbFetch('tbl_cmp_case', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(Object.assign({ tcc_no: NO }, caseFields)) })))[0].tcc_id;
  }
  const acc = (await sbFetch(`tbl_cmp_case_accused?select=tcca_id&tcc_id=eq.${tccId}`)).data || [];
  if (!acc.length) {
    await must('insert accused', sbFetch('tbl_cmp_case_accused', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ tcc_id: tccId, tcca_no: 1, tcca_name: 'ไม่มีผู้ถูกกล่าวหา (เรื่องทั่วไป)', tcca_position: '-', tcca_idcard: '-', tcca_agency: 'สำนักงาน ป.ป.ท.' }) }));
  }
  const reqFields = { trr_status: '005', trr_urgent: true, trr_signed_secgen: false, trr_sub_committee: null, trr_resolution_data: { procType: '7.3', generalType: 'APPOINT_SUBCOMMITTEE' }, is_deleted: false };
  const rq = (await sbFetch(`tbl_res_request?select=trr_id&tcc_id=eq.${tccId}`)).data || [];
  let out;
  if (rq.length) {
    out = await must('patch request', sbFetch(`tbl_res_request?tcc_id=eq.${tccId}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(reqFields) }));
  } else {
    out = await must('insert request', sbFetch('tbl_res_request', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(Object.assign({ tcc_id: tccId }, reqFields)) }));
  }
  console.log(`OK ${NO} tcc_id=${tccId} trr_id=${out[0].trr_id} status=${out[0].trr_status} urgent=${out[0].trr_urgent}`);
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
