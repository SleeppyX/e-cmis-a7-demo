/*
 * One-off seed/reset script for demo case 0005/2569 — used to play alongside
 * กจ.8.3's demo at the moment กจ.7 ส่ง ป.วินัย ไปหา กจ.8 (7.2 guilty/discipline track).
 * Data sourced from `scenario e-cmis.xlsx` + the กจ.8 team's prepared case image.
 * Starts at trr_status '115' (PENDING_DISPATCH_GUILTY_72) with disciplinaryTrack72
 * PENDING, ready for the "ส่ง ป.วินัย → กจ.8" action added in ruling-report.html.
 *
 * Run:
 *   node scripts/seed-case-0005-2569.js            # create if missing
 *   node scripts/seed-case-0005-2569.js --reset     # patch existing case back to 115/PENDING
 */
const { sbFetch } = require('./lib/supabase-rest.js');

const CASE_NO = '0005/2569';

const CASE_ROW = {
  tcc_no: CASE_NO,
  tcc_subject: 'รายงานการไต่สวนข้อเท็จจริงเพื่อวินิจฉัยชี้มูล กรณีผู้อำนวยการสถานศึกษาเรียกรับเงินแป๊ะเจี๊ยะจากผู้ปกครอง',
  tcc_allegation: 'เรียกรับเงิน "แป๊ะเจี๊ยะ" จากผู้ปกครองโดยไม่ออกใบเสร็จ และนำเงินเข้ากองทุนส่วนตัว เพื่อแลกกับสิทธิ์ในการรับนักเรียนเข้าศึกษาต่อ',
  // DB CHECK ยอมรับเฉพาะ 'ม.18/4'/'ม.62' (ม.18/1 ก ตาม xlsx ไม่ผ่าน constraint จริง) ใช้ ม.18/4 แทน
  tcc_legal_base: 'ม.18/4',
  tcc_complainant: 'นายสมชาย รักความยุติธรรม',
  tcc_owner: 'สมชาย ใจดี',
  tcc_owner_org: 'กองบริหารคดี',
  tcc_received_date: '2026-01-10',
  tcc_prescription_date: '2029-01-10',
  tcc_doc_ref: 'ศรร. 0026/2569',
  tcc_doc_type: '644',
  tcc_urgent: false,
  tcc_complex: false
};

const ACCUSED_ROW = {
  tcca_no: 1,
  tcca_name: 'นายสมศักดิ์ หาผลประโยชน์',
  tcca_position: 'ผู้อำนวยการสถานศึกษา',
  tcca_idcard: '3-1099-0xxxx-xx-x',
  tcca_agency: 'สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน'
};

const RESOLUTION_DATA = {
  status: 'PENDING_DISPATCH_GUILTY_72',
  resolution72: 'GUILTY_72',
  boardOpinion72: 'คณะกรรมการ ป.ป.ท. พิจารณาแล้วเห็นว่าการกระทำของผู้ถูกกล่าวหามีมูลความผิดทางวินัยอย่างร้ายแรง',
  resolutionNo72: 'มติที่ 56/2569',
  resolutionDate72: '2026-09-28',
  investigatorRef72: 'คณะพนักงานไต่สวน',
  investigatorOpinion72: '',
  presenterNote72: '',
  guiltyCriminal72: false,
  guiltyDiscipline72: true,
  criminalTrack72: null,
  disciplinaryTrack72: { status: 'PENDING' },
  flightRisk72: false,
  discAgency72: 'สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน',
  discAccused72: 'นายสมศักดิ์ หาผลประโยชน์',
  discCharge72: 'เรียกรับเงิน "แป๊ะเจี๊ยะ" จากผู้ปกครองโดยไม่ออกใบเสร็จ และนำเงินเข้ากองทุนส่วนตัว เพื่อแลกกับสิทธิ์ในการรับนักเรียนเข้าศึกษาต่อ',
  discPenalty72: 'ไล่ออก',
  disciplinaryFinding72: 'มีมูลความผิดทางวินัยอย่างร้ายแรง ฐานทุจริตต่อหน้าที่ราชการ',
  signedRulingAt: '2026-09-30T09:00:00.000Z',
  // ค่าตั้งต้นของฟอร์มส่ง ป.วินัย → กจ.8 (ให้ตรงกับเคสที่ กจ.8 เตรียมไว้)
  pWinaiNo72: 'ป.วินัย 56/2569-1',
  discLetterNo72: 'ปปท 0040/ว451',
  discBatchId72: 'B-DISC-2026-08-045'
};

async function findCase() {
  const r = await sbFetch(`tbl_cmp_case?tcc_no=eq.${encodeURIComponent(CASE_NO)}&select=tcc_id,is_deleted`);
  if (!r.ok) throw new Error(`lookup failed: ${JSON.stringify(r.data)}`);
  return (r.data || [])[0] || null;
}

async function createCase() {
  const insCase = await sbFetch('tbl_cmp_case', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(CASE_ROW)
  });
  if (!insCase.ok || !insCase.data || !insCase.data[0]) {
    throw new Error(`insert tbl_cmp_case failed — ${JSON.stringify(insCase.data)}`);
  }
  const tccId = insCase.data[0].tcc_id;

  const insAcc = await sbFetch('tbl_cmp_case_accused', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ tcc_id: tccId, ...ACCUSED_ROW })
  });
  if (!insAcc.ok) {
    throw new Error(`insert tbl_cmp_case_accused failed — ${JSON.stringify(insAcc.data)}`);
  }

  const insReq = await sbFetch('tbl_res_request', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      tcc_id: tccId,
      trr_status: '115',
      trr_urgent: false,
      trr_signed_secgen: true,
      trr_sub_committee: null,
      trr_meeting_no: '7/2569',
      trr_agenda_no: '7.4',
      trr_meeting_date: '2026-09-28',
      trr_resolution_data: RESOLUTION_DATA
    })
  });
  if (!insReq.ok || !insReq.data || !insReq.data[0]) {
    throw new Error(`insert tbl_res_request failed — ${JSON.stringify(insReq.data)}`);
  }
  return { tccId, trrId: insReq.data[0].trr_id };
}

async function resetCase(tccId) {
  const reqList = await sbFetch(`tbl_res_request?tcc_id=eq.${tccId}&select=trr_id&is_deleted=eq.false&order=trr_id.desc&limit=1`);
  if (!reqList.ok || !reqList.data || !reqList.data[0]) {
    throw new Error(`reset: no tbl_res_request row found for tcc_id=${tccId} — ${JSON.stringify(reqList.data)}`);
  }
  const trrId = reqList.data[0].trr_id;

  const patch = await sbFetch(`tbl_res_request?trr_id=eq.${trrId}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      trr_status: '115',
      trr_signed_secgen: true,
      trr_meeting_no: '7/2569',
      trr_agenda_no: '7.4',
      trr_meeting_date: '2026-09-28',
      trr_resolution_data: RESOLUTION_DATA
    })
  });
  if (!patch.ok || !patch.data || !patch.data[0]) {
    throw new Error(`reset PATCH failed — ${JSON.stringify(patch.data)}`);
  }
  return { tccId, trrId };
}

(async () => {
  const doReset = process.argv.includes('--reset');
  try {
    const existing = await findCase();
    if (existing && existing.is_deleted) {
      throw new Error(`case ${CASE_NO} exists but is soft-deleted (tcc_id=${existing.tcc_id}) — manual fix needed`);
    }
    if (existing) {
      if (!doReset) {
        console.log(`SKIP ${CASE_NO} already exists (tcc_id=${existing.tcc_id}); use --reset to restore to 115/PENDING`);
        return;
      }
      const r = await resetCase(existing.tcc_id);
      console.log(`RESET ${CASE_NO} -> tcc_id=${r.tccId} trr_id=${r.trrId} status=115 disciplinaryTrack72=PENDING`);
    } else {
      const r = await createCase();
      console.log(`CREATED ${CASE_NO} -> tcc_id=${r.tccId} trr_id=${r.trrId} status=115 disciplinaryTrack72=PENDING`);
    }
  } catch (err) {
    console.error(`FAIL ${CASE_NO}:`, err.message);
    process.exitCode = 1;
  }
})();
