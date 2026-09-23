/*
 * One-off seeding script: inserts real Supabase rows for demo/test cases
 * 9301/2569-9310/2569, all starting fresh at the secgen entry point
 * (PENDING_SECGEN / PENDING_SECGEN_72) so a user can click through the
 * entire flow end-to-end from the very first step, for both lines:
 *   - 9301-9305/2569: 7.1 ไต่สวนเบื้องต้น (trr_status '005')
 *   - 9306-9310/2569: 7.2 วินิจฉัยชี้มูล   (trr_status '104')
 * Follows the same insert pattern as scripts/seed-cases-9211-9222.js.
 *
 * Run: node scripts/seed-cases-9301-9310.js
 */
const { sbFetch } = require('./lib/supabase-rest.js');

const CASES = [
  // ── 7.1 ไต่สวนเบื้องต้น ──────────────────────────────────────────
  { id:'9301/2569', subject:'กล่าวหาเจ้าหน้าที่สำนักงานที่ดินจังหวัดแห่งหนึ่ง เรียกรับเงินเพื่อเร่งรัดการออกโฉนดที่ดิน',
    allegation:'เรียกรับเงินจากประชาชนผู้ยื่นคำขอออกโฉนดที่ดินเพื่อแลกกับการเร่งรัดกระบวนการให้เร็วกว่าคิวปกติ',
    legalBase:'ม.18/4', complainant:'ประชาชนผู้ยื่นคำขอ (ผู้ร้อง)', owner:'นายสุทธิพงษ์ ที่ดินสุจริต', ownerOrg:'สำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ เขต 1',
    receivedDate:'2026-07-01', prescription:'2029-07-01', docRef:'ปป 0021/9301 ลงวันที่ 1 กรกฎาคม 2569', urgent:false, status:'005',
    accused:{ name:'นายวีรศักดิ์ เร่งโฉนด', pos:'เจ้าพนักงานที่ดินชำนาญงาน', idcard:'3-1301-0xxxx-xx-x', agency:'สำนักงานที่ดินจังหวัดแห่งหนึ่ง' } },
  { id:'9302/2569', subject:'กล่าวหาเจ้าหน้าที่สำนักงานขนส่งจังหวัดแห่งหนึ่ง เรียกรับเงินเพื่อออกใบอนุญาตขับขี่โดยไม่ผ่านการทดสอบจริง ใกล้ขาดอายุความ',
    allegation:'เรียกรับเงินจากผู้ขอรับใบอนุญาตขับขี่เพื่อแลกกับการอนุมัติโดยไม่ผ่านการทดสอบตามหลักเกณฑ์จริง คดีใกล้ครบกำหนดอายุความ',
    legalBase:'ม.62', complainant:'เจ้าหน้าที่ภายในหน่วยงาน (ผู้ร้อง)', owner:'นางสาวปิยะดา ขนส่งสุจริต', ownerOrg:'สำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ เขต 2',
    receivedDate:'2026-07-05', prescription:'2026-10-25', docRef:'ปป 0021/9302 ลงวันที่ 5 กรกฎาคม 2569', urgent:true, status:'005',
    accused:{ name:'นายอรรถพล ออกใบขับขี่', pos:'นักวิชาการขนส่งชำนาญการ', idcard:'3-1302-0xxxx-xx-x', agency:'สำนักงานขนส่งจังหวัดแห่งหนึ่ง' } },
  { id:'9303/2569', subject:'กล่าวหาเจ้าหน้าที่โรงพยาบาลส่งเสริมสุขภาพตำบลแห่งหนึ่ง ทุจริตการเบิกจ่ายค่าตอบแทนเจ้าหน้าที่',
    allegation:'จัดทำเอกสารเบิกจ่ายค่าตอบแทนปฏิบัติงานนอกเวลาราชการอันเป็นเท็จ เบิกเงินเกินกว่าที่ปฏิบัติงานจริงต่อเนื่องหลายเดือน',
    legalBase:'ม.18/4', complainant:'เจ้าหน้าที่ภายในหน่วยงาน (ผู้ร้อง)', owner:'นายกิตติชัย สาธารณสุขใส', ownerOrg:'สำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ เขต 3',
    receivedDate:'2026-07-10', prescription:'2029-07-10', docRef:'ปป 0021/9303 ลงวันที่ 10 กรกฎาคม 2569', urgent:false, status:'005',
    accused:{ name:'นางสาวรัตนาภรณ์ เบิกเกิน', pos:'เจ้าพนักงานสาธารณสุขชำนาญงาน', idcard:'3-1303-0xxxx-xx-x', agency:'โรงพยาบาลส่งเสริมสุขภาพตำบลแห่งหนึ่ง' } },
  { id:'9304/2569', subject:'กล่าวหาเจ้าหน้าที่สำนักงานพาณิชย์จังหวัดแห่งหนึ่ง เรียกรับเงินเพื่อละเว้นการตรวจสอบสินค้าราคาควบคุม ใกล้ขาดอายุความ',
    allegation:'เรียกรับเงินจากผู้ประกอบการเพื่อละเว้นการตรวจสอบและปรับผู้ค้าที่ขายสินค้าราคาควบคุมเกินราคาที่กำหนด',
    legalBase:'ม.62', complainant:'ผู้บริโภคในพื้นที่ (ผู้ร้อง)', owner:'นายเฉลิมพล พาณิชย์เที่ยงธรรม', ownerOrg:'สำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ เขต 4',
    receivedDate:'2026-07-15', prescription:'2026-11-01', docRef:'ปป 0021/9304 ลงวันที่ 15 กรกฎาคม 2569', urgent:true, status:'005',
    accused:{ name:'นายไพโรจน์ ละเว้นตรวจ', pos:'นักวิชาการพาณิชย์ชำนาญการ', idcard:'3-1304-0xxxx-xx-x', agency:'สำนักงานพาณิชย์จังหวัดแห่งหนึ่ง' } },
  { id:'9305/2569', subject:'กล่าวหาเจ้าหน้าที่องค์การบริหารส่วนตำบลแห่งหนึ่ง ทุจริตการจัดซื้อวัสดุการเกษตรแจกจ่ายเกษตรกร',
    allegation:'จัดซื้อวัสดุการเกษตรคุณภาพต่ำกว่าสเปกในราคาสูงกว่าท้องตลาด แล้วเบิกจ่ายเงินส่วนต่างเข้ากระเป๋าตนเอง',
    legalBase:'ม.18/4', complainant:'สมาชิกสภาองค์การบริหารส่วนตำบล (ผู้ร้อง)', owner:'นางสาวศิริพร ท้องถิ่นใส', ownerOrg:'สำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ เขต 5',
    receivedDate:'2026-07-20', prescription:'2029-07-20', docRef:'ปป 0021/9305 ลงวันที่ 20 กรกฎาคม 2569', urgent:false, status:'005',
    accused:{ name:'นายชูเกียรติ วัสดุเกษตร', pos:'ปลัดองค์การบริหารส่วนตำบล', idcard:'3-1305-0xxxx-xx-x', agency:'องค์การบริหารส่วนตำบลแห่งหนึ่ง' } },

  // ── 7.2 วินิจฉัยชี้มูล ──────────────────────────────────────────
  { id:'9306/2569', subject:'รายงานการไต่สวนข้อเท็จจริงเพื่อวินิจฉัยชี้มูล กรณีเจ้าหน้าที่สำนักงานสาธารณสุขจังหวัดแห่งหนึ่ง ทุจริตการจัดซื้อยาและเวชภัณฑ์ ใกล้ขาดอายุความ',
    allegation:'ร่วมกันกำหนดสเปกยาและเวชภัณฑ์ให้ตรงกับสินค้าของบริษัทเอกชนรายหนึ่งโดยเฉพาะ เอื้อประโยชน์ในการประมูล คดีใกล้ครบกำหนดอายุความ',
    legalBase:'ม.18/4', complainant:'เจ้าหน้าที่พัสดุภายในหน่วยงาน (ผู้ร้อง)', owner:'นายธีรพงษ์ เวชภัณฑ์สุจริต (นิติกรชำนาญการ)', ownerOrg:'กองปราบปรามการทุจริตในภาครัฐ 1',
    receivedDate:'2026-07-02', prescription:'2026-10-28', docRef:'ปป 0021/9306 ลงวันที่ 2 กรกฎาคม 2569', urgent:true, status:'104',
    accused:{ name:'นายประกิต จัดซื้อยา', pos:'เภสัชกรชำนาญการพิเศษ', idcard:'3-1306-0xxxx-xx-x', agency:'สำนักงานสาธารณสุขจังหวัดแห่งหนึ่ง' } },
  { id:'9307/2569', subject:'รายงานการไต่สวนข้อเท็จจริงเพื่อวินิจฉัยชี้มูล กรณีเจ้าหน้าที่กรมที่ดินสาขาแห่งหนึ่ง สมคบออกโฉนดที่ดินทับที่สาธารณะ',
    allegation:'ร่วมกันออกโฉนดที่ดินทับที่สาธารณประโยชน์โดยรู้อยู่แล้วว่าเป็นที่หวงห้าม เอื้อประโยชน์ให้นายทุนรายหนึ่ง',
    legalBase:'ม.18/4', complainant:'ราษฎรในพื้นที่ (ผู้ร้อง)', owner:'นางสาวอรวรรณ ที่ดินสาธารณะ (นิติกรชำนาญการ)', ownerOrg:'กองปราบปรามการทุจริตในภาครัฐ 2',
    receivedDate:'2026-07-08', prescription:'2029-07-08', docRef:'ปป 0021/9307 ลงวันที่ 8 กรกฎาคม 2569', urgent:false, status:'104',
    accused:{ name:'นายสมนึก โฉนดทับที่', pos:'เจ้าพนักงานที่ดินชำนาญการพิเศษ', idcard:'3-1307-0xxxx-xx-x', agency:'กรมที่ดินสาขาแห่งหนึ่ง' } },
  { id:'9308/2569', subject:'รายงานการไต่สวนข้อเท็จจริงเพื่อวินิจฉัยชี้มูล กรณีเจ้าหน้าที่กรมสรรพสามิตพื้นที่แห่งหนึ่ง เรียกรับเงินละเว้นการจับกุมสินค้าหนีภาษี ใกล้ขาดอายุความ',
    allegation:'เรียกรับเงินจากผู้ค้าสินค้าหนีภาษีสรรพสามิตเพื่อแลกกับการละเว้นการจับกุมและดำเนินคดี ต่อเนื่องเป็นระยะเวลานาน คดีใกล้ครบกำหนดอายุความ',
    legalBase:'ม.18/4', complainant:'เจ้าหน้าที่ตำรวจท้องที่ (ผู้ร้อง)', owner:'นายวรพจน์ สรรพสามิตสุจริต (เจ้าพนักงานป้องกันการทุจริตชำนาญการ)', ownerOrg:'กองปราบปรามการทุจริตในภาครัฐ 6',
    receivedDate:'2026-07-12', prescription:'2026-11-05', docRef:'ปป 0021/9308 ลงวันที่ 12 กรกฎาคม 2569', urgent:true, status:'104',
    accused:{ name:'นายบุญมี ละเว้นจับกุม', pos:'นักวิชาการสรรพสามิตชำนาญการ', idcard:'3-1308-0xxxx-xx-x', agency:'กรมสรรพสามิตพื้นที่แห่งหนึ่ง' } },
  { id:'9309/2569', subject:'รายงานการไต่สวนข้อเท็จจริงเพื่อวินิจฉัยชี้มูล กรณีเจ้าหน้าที่สำนักงานเขตพื้นที่การศึกษาแห่งหนึ่ง ทุจริตการจัดซื้อคอมพิวเตอร์เพื่อการศึกษา',
    allegation:'ร่วมกันกำหนดสเปกครุภัณฑ์คอมพิวเตอร์ให้เอื้อประโยชน์แก่บริษัทเอกชนรายหนึ่ง จัดซื้อในราคาสูงกว่าท้องตลาดอย่างผิดปกติ',
    legalBase:'ม.18/4', complainant:'ครูในสังกัด (ผู้ร้อง)', owner:'นางสาวพิมพ์ชนก การศึกษาสุจริต (นิติกรปฏิบัติการ)', ownerOrg:'กองปราบปรามการทุจริตในภาครัฐ 7',
    receivedDate:'2026-07-18', prescription:'2029-07-18', docRef:'ปป 0021/9309 ลงวันที่ 18 กรกฎาคม 2569', urgent:false, status:'104',
    accused:{ name:'นายสมชาย จัดซื้อคอม', pos:'ผู้อำนวยการสำนักงานเขตพื้นที่การศึกษา', idcard:'3-1309-0xxxx-xx-x', agency:'สำนักงานเขตพื้นที่การศึกษาแห่งหนึ่ง' } },
  { id:'9310/2569', subject:'รายงานการไต่สวนข้อเท็จจริงเพื่อวินิจฉัยชี้มูล กรณีเจ้าหน้าที่สำนักงานทางหลวงชนบทแห่งหนึ่ง ทุจริตการตรวจรับงานก่อสร้างถนนไม่ตรงตามสัญญา',
    allegation:'ตรวจรับงานก่อสร้างถนนทั้งที่ผู้รับจ้างดำเนินการไม่ครบถ้วนตามแบบและสัญญา เป็นเหตุให้ทางราชการเสียหาย',
    legalBase:'ม.18/4', complainant:'ประชาชนผู้ใช้เส้นทาง (ผู้ร้อง)', owner:'นายอนุชา ทางหลวงสุจริต (นิติกรชำนาญการ)', ownerOrg:'กองปราบปรามการทุจริตในภาครัฐ 8',
    receivedDate:'2026-07-25', prescription:'2029-07-25', docRef:'ปป 0021/9310 ลงวันที่ 25 กรกฎาคม 2569', urgent:false, status:'104',
    accused:{ name:'นายประดิษฐ์ ตรวจรับเท็จ', pos:'วิศวกรโยธาชำนาญการ', idcard:'3-1310-0xxxx-xx-x', agency:'สำนักงานทางหลวงชนบทแห่งหนึ่ง' } }
];

async function insertOne(c) {
  const insCase = await sbFetch('tbl_cmp_case', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      tcc_no: c.id, tcc_subject: c.subject, tcc_allegation: c.allegation,
      tcc_legal_base: c.legalBase, tcc_complainant: c.complainant,
      tcc_owner: c.owner, tcc_owner_org: c.ownerOrg,
      tcc_received_date: c.receivedDate, tcc_prescription_date: c.prescription,
      tcc_doc_ref: c.docRef, tcc_doc_type: '644', tcc_urgent: false, tcc_complex: false
    })
  });
  if (!insCase.ok || !insCase.data || !insCase.data[0]) {
    throw new Error(`${c.id}: insert tbl_cmp_case failed — ${JSON.stringify(insCase.data)}`);
  }
  const tccId = insCase.data[0].tcc_id;

  const insAcc = await sbFetch('tbl_cmp_case_accused', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      tcc_id: tccId, tcca_no: 1, tcca_name: c.accused.name,
      tcca_position: c.accused.pos, tcca_idcard: c.accused.idcard, tcca_agency: c.accused.agency
    })
  });
  if (!insAcc.ok) {
    throw new Error(`${c.id}: insert tbl_cmp_case_accused failed — ${JSON.stringify(insAcc.data)}`);
  }

  const insReq = await sbFetch('tbl_res_request', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      tcc_id: tccId, trr_status: c.status, trr_urgent: false,
      trr_signed_secgen: false, trr_sub_committee: null
    })
  });
  if (!insReq.ok || !insReq.data || !insReq.data[0]) {
    throw new Error(`${c.id}: insert tbl_res_request failed — ${JSON.stringify(insReq.data)}`);
  }
  return { tccId, trrId: insReq.data[0].trr_id };
}

(async () => {
  const onlyFirst = process.argv.includes('--test-first');
  const list = onlyFirst ? CASES.slice(0, 1) : CASES;
  for (const c of list) {
    try {
      const r = await insertOne(c);
      console.log(`OK  ${c.id} -> tcc_id=${r.tccId} trr_id=${r.trrId}`);
    } catch (err) {
      console.error(`FAIL ${c.id}:`, err.message);
      process.exitCode = 1;
      if (onlyFirst) return;
    }
  }
})();
