/*
 * One-off seeding script: inserts real Supabase rows for demo/test cases
 * 9211/2569-9222/2569 (mirrors assets/ecmis-app.js CASES entries of the same
 * IDs) so they appear in inbox.html's live list, which reads only from
 * Supabase via loadCasesFromSupabase() — the local mock array alone is never
 * enough (see sql/seed_test_cases_secgen_entry.sql for the established
 * precedent this follows).
 *
 * tcc_legal_base has a CHECK constraint accepting only 'ม.18/4'/'ม.62', so
 * 7.2 cases (mock legalBase 'ม.24 วรรคท้าย') are normalized to 'ม.18/4' on
 * insert, matching how 9203/9204/2569 were already seeded.
 *
 * Run: node scripts/seed-cases-9211-9222.js
 */
const { sbFetch } = require('./lib/supabase-rest.js');

const CASES = [
  { id:'9211/2569', subject:'กล่าวหาเจ้าหน้าที่เทศบาลนครแห่งหนึ่ง เรียกรับเงินจากผู้ประกอบการก่อสร้างเพื่อออกใบอนุญาตก่อสร้างอาคารสูง ใกล้ขาดอายุความ',
    allegation:'เรียกรับเงินจากผู้ประกอบการก่อสร้างเป็นการตอบแทนการออกใบอนุญาตก่อสร้างอาคารสูง คดีใกล้ครบกำหนดอายุความ',
    legalBase:'ม.18/4', complainant:'ผู้ประกอบการก่อสร้างในพื้นที่ (ผู้ร้อง)', owner:'นายกิตติศักดิ์ มั่นคงธรรม', ownerOrg:'สำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ เขต 8',
    receivedDate:'2026-01-12', prescription:'2026-10-14', docRef:'ปป 0021/9211 ลงวันที่ 12 มกราคม 2569', urgent:true, status:'005',
    accused:{ name:'นายประสิทธิ์ ออกใบอนุญาต', pos:'ผู้อำนวยการกองช่าง เทศบาลนคร', idcard:'3-1110-0xxxx-xx-x', agency:'เทศบาลนครแห่งหนึ่ง' } },
  { id:'9212/2569', subject:'กล่าวหาเจ้าหน้าที่องค์การบริหารส่วนจังหวัดแห่งหนึ่ง ทุจริตการจัดซื้อจัดจ้างครุภัณฑ์การแพทย์ ใกล้ขาดอายุความ',
    allegation:'ร่วมกันกำหนดสเปกและฮั้วประมูลการจัดซื้อครุภัณฑ์การแพทย์ เอื้อประโยชน์ให้บริษัทเอกชนรายหนึ่ง คดีใกล้ครบกำหนดอายุความ',
    legalBase:'ม.62', complainant:'เจ้าหน้าที่พัสดุภายในหน่วยงาน (ผู้ร้อง)', owner:'นางสาวรัชนี ตรวจสอบ', ownerOrg:'สำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ เขต 1',
    receivedDate:'2026-02-08', prescription:'2026-10-22', docRef:'ปป 0021/9212 ลงวันที่ 8 กุมภาพันธ์ 2569', urgent:true, status:'005',
    accused:{ name:'นายอนันต์ ฮั้วประมูล', pos:'หัวหน้าฝ่ายพัสดุ องค์การบริหารส่วนจังหวัด', idcard:'3-1120-0xxxx-xx-x', agency:'องค์การบริหารส่วนจังหวัดแห่งหนึ่ง' } },
  { id:'9213/2569', subject:'กล่าวหาเจ้าหน้าที่สำนักงานโยธาธิการและผังเมืองจังหวัดแห่งหนึ่ง เรียกรับเงินเพื่อออกใบอนุญาตจัดสรรที่ดิน ใกล้ขาดอายุความ',
    allegation:'เรียกรับเงินจากผู้ประกอบการเพื่อออกใบอนุญาตจัดสรรที่ดินโดยไม่ตรวจสอบผังเมืองตามระเบียบ คดีใกล้ครบกำหนดอายุความ',
    legalBase:'ม.18/4', complainant:'ผู้ประกอบการจัดสรรที่ดิน (ผู้ร้อง)', owner:'นายชาญวิทย์ รักษ์กฎหมาย', ownerOrg:'สำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ เขต 2',
    receivedDate:'2026-03-20', prescription:'2026-10-27', docRef:'ปป 0021/9213 ลงวันที่ 20 มีนาคม 2569', urgent:true, status:'005',
    accused:{ name:'นายพิเชษฐ์ ผังเมือง', pos:'หัวหน้ากลุ่มงานควบคุมอาคาร', idcard:'3-1130-0xxxx-xx-x', agency:'สำนักงานโยธาธิการและผังเมืองจังหวัดแห่งหนึ่ง' } },
  { id:'9214/2569', subject:'กล่าวหาเจ้าหน้าที่สำนักงานประมงจังหวัดแห่งหนึ่ง ยักยอกเงินอุดหนุนเกษตรกรผู้เพาะเลี้ยงสัตว์น้ำ',
    allegation:'ยักยอกเงินอุดหนุนโครงการส่งเสริมเกษตรกรผู้เพาะเลี้ยงสัตว์น้ำโดยจัดทำเอกสารเบิกจ่ายเท็จ รวมหลายราย',
    legalBase:'ม.62', complainant:'กลุ่มเกษตรกรผู้เพาะเลี้ยงสัตว์น้ำ (ผู้ร้อง)', owner:'นายวสันต์ ซื่อธรรม', ownerOrg:'สำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ เขต 3',
    receivedDate:'2026-04-15', prescription:'2029-04-15', docRef:'ปป 0021/9214 ลงวันที่ 15 เมษายน 2569', urgent:false, status:'005',
    accused:{ name:'นางสาวสุกัญญา เบิกจ่ายเกิน', pos:'นักวิชาการประมงชำนาญการ', idcard:'3-1140-0xxxx-xx-x', agency:'สำนักงานประมงจังหวัดแห่งหนึ่ง' } },
  { id:'9215/2569', subject:'กล่าวหาเจ้าหน้าที่สำนักงานปศุสัตว์จังหวัดแห่งหนึ่ง ใช้อำนาจโดยมิชอบออกใบรับรองฟาร์มปศุสัตว์โดยไม่ตรวจสอบจริง',
    allegation:'ใช้อำนาจในตำแหน่งหน้าที่ออกใบรับรองมาตรฐานฟาร์มปศุสัตว์ให้แก่ผู้ประกอบการรายหนึ่งโดยไม่ได้ลงตรวจสอบสถานที่จริง',
    legalBase:'ม.18/4', complainant:'เกษตรกรผู้เลี้ยงสัตว์รายอื่นในพื้นที่ (ผู้ร้อง)', owner:'นางสาวนภาพร ตรงไปตรงมา', ownerOrg:'สำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ เขต 4',
    receivedDate:'2026-05-22', prescription:'2029-05-22', docRef:'ปป 0021/9215 ลงวันที่ 22 พฤษภาคม 2569', urgent:false, status:'005',
    accused:{ name:'นายบรรจง รับรองเท็จ', pos:'นายสัตวแพทย์ชำนาญการ', idcard:'3-1150-0xxxx-xx-x', agency:'สำนักงานปศุสัตว์จังหวัดแห่งหนึ่ง' } },
  { id:'9216/2569', subject:'กล่าวหาเจ้าหน้าที่สำนักงานเกษตรจังหวัดแห่งหนึ่ง เรียกรับเงินจากเกษตรกรเพื่ออนุมัติสิทธิ์รับปุ๋ยอุดหนุนราคาพิเศษ',
    allegation:'เรียกรับเงินจากเกษตรกรเพื่อแลกกับการอนุมัติสิทธิ์เข้าร่วมโครงการปุ๋ยอุดหนุนราคาพิเศษของรัฐ รวมหลายราย',
    legalBase:'ม.62', complainant:'กลุ่มเกษตรกรในพื้นที่ (ผู้ร้อง)', owner:'นายทวีศักดิ์ มั่นในธรรม', ownerOrg:'สำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ เขต 5',
    receivedDate:'2026-06-10', prescription:'2029-06-10', docRef:'ปป 0021/9216 ลงวันที่ 10 มิถุนายน 2569', urgent:false, status:'005',
    accused:{ name:'นายสมบูรณ์ ปุ๋ยพิเศษ', pos:'นักวิชาการส่งเสริมการเกษตรชำนาญการ', idcard:'3-1160-0xxxx-xx-x', agency:'สำนักงานเกษตรจังหวัดแห่งหนึ่ง' } },
  { id:'9217/2569', subject:'รายงานการไต่สวนข้อเท็จจริงเพื่อวินิจฉัยชี้มูล กรณีเจ้าหน้าที่หน่วยป้องกันรักษาป่าแห่งหนึ่ง เรียกรับเงินแลกใบอนุญาตทำไม้ ใกล้ขาดอายุความ',
    allegation:'เรียกรับเงินจากผู้ประกอบการเพื่อออกใบอนุญาตทำไม้ในเขตป่าสงวนแห่งชาติโดยมิชอบ เอื้อประโยชน์ให้เอกชนหลายราย คดีใกล้ครบกำหนดอายุความ',
    legalBase:'ม.18/4', complainant:'ราษฎรในพื้นที่ป่าอนุรักษ์ (ผู้ร้อง)', owner:'นายเอกชัย รักษาป่า (นิติกรชำนาญการ)', ownerOrg:'กองปราบปรามการทุจริตในภาครัฐ 5',
    receivedDate:'2026-01-25', prescription:'2026-10-19', docRef:'ปป 0021/9217 ลงวันที่ 25 มกราคม 2569', urgent:true, status:'104',
    accused:{ name:'นายสมโภชน์ ทำไม้', pos:'หัวหน้าหน่วยป้องกันรักษาป่า', idcard:'3-1170-0xxxx-xx-x', agency:'หน่วยป้องกันรักษาป่าแห่งหนึ่ง' } },
  { id:'9218/2569', subject:'รายงานการไต่สวนข้อเท็จจริงเพื่อวินิจฉัยชี้มูล กรณีเจ้าหน้าที่สำนักงานสรรพากรพื้นที่แห่งหนึ่ง เรียกรับเงินแลกลดหย่อนภาษี ใกล้ขาดอายุความ',
    allegation:'เรียกรับเงินจากผู้ประกอบการเพื่อแลกกับการลดหย่อนการประเมินภาษีและละเว้นการตรวจสอบบัญชี คดีใกล้ครบกำหนดอายุความ',
    legalBase:'ม.18/4', complainant:'ผู้ประกอบการที่ถูกเรียกรับเงิน (ผู้ร้อง)', owner:'นางสาวพรทิพย์ ตรวจภาษี (เจ้าพนักงานป้องกันการทุจริตชำนาญการ)', ownerOrg:'กองปราบปรามการทุจริตในภาครัฐ 1',
    receivedDate:'2026-02-18', prescription:'2026-10-13', docRef:'ปป 0021/9218 ลงวันที่ 18 กุมภาพันธ์ 2569', urgent:true, status:'104',
    accused:{ name:'นายอำนาจ ลดหย่อนให้', pos:'สรรพากรพื้นที่สาขา', idcard:'3-1180-0xxxx-xx-x', agency:'สำนักงานสรรพากรพื้นที่แห่งหนึ่ง' } },
  { id:'9219/2569', subject:'รายงานการไต่สวนข้อเท็จจริงเพื่อวินิจฉัยชี้มูล กรณีเจ้าหน้าที่สำนักงานจัดหางานจังหวัดแห่งหนึ่ง เรียกรับเงินค่าธรรมเนียมอนุญาตทำงานเกินอัตรา ใกล้ขาดอายุความ',
    allegation:'เรียกเก็บค่าธรรมเนียมการออกใบอนุญาตทำงานของแรงงานต่างด้าวเกินอัตราที่กฎหมายกำหนด นำเงินส่วนต่างเข้ากระเป๋าตนเอง รวมหลายราย คดีใกล้ครบกำหนดอายุความ',
    legalBase:'ม.18/4', complainant:'แรงงานต่างด้าวที่ถูกเรียกเก็บเงิน (ผู้ร้อง)', owner:'นายกฤษดา จัดหางานสุจริต (นิติกรปฏิบัติการ)', ownerOrg:'กองปราบปรามการทุจริตในภาครัฐ 6',
    receivedDate:'2026-03-05', prescription:'2026-10-30', docRef:'ปป 0021/9219 ลงวันที่ 5 มีนาคม 2569', urgent:true, status:'104',
    accused:{ name:'นายประยุทธ เก็บค่าธรรมเนียม', pos:'เจ้าพนักงานแรงงานชำนาญงาน', idcard:'3-1190-0xxxx-xx-x', agency:'สำนักงานจัดหางานจังหวัดแห่งหนึ่ง' } },
  { id:'9220/2569', subject:'รายงานการไต่สวนข้อเท็จจริงเพื่อวินิจฉัยชี้มูล กรณีเจ้าหน้าที่การประปาส่วนภูมิภาคสาขาแห่งหนึ่ง ฮั้วประมูลจัดซื้อท่อประปา',
    allegation:'ร่วมกันกำหนดคุณสมบัติผู้เสนอราคาและฮั้วประมูลการจัดซื้อท่อประปาให้แก่พวกพ้อง เป็นเหตุให้ทางราชการเสียหาย',
    legalBase:'ม.18/4', complainant:'ผู้เสนอราคารายอื่นที่ไม่ได้รับความเป็นธรรม (ผู้ร้อง)', owner:'นายวิชัย ตรวจการประปา (นิติกรชำนาญการ)', ownerOrg:'กองปราบปรามการทุจริตในภาครัฐ 3',
    receivedDate:'2026-04-28', prescription:'2029-04-28', docRef:'ปป 0021/9220 ลงวันที่ 28 เมษายน 2569', urgent:false, status:'104',
    accused:{ name:'นายสุรพล ฮั้วท่อ', pos:'ผู้จัดการการประปาส่วนภูมิภาคสาขา', idcard:'3-1200-0xxxx-xx-x', agency:'การประปาส่วนภูมิภาคสาขาแห่งหนึ่ง' } },
  { id:'9221/2569', subject:'รายงานการไต่สวนข้อเท็จจริงเพื่อวินิจฉัยชี้มูล กรณีเจ้าหน้าที่การไฟฟ้าส่วนภูมิภาคสาขาแห่งหนึ่ง ยักยอกเงินค่าไฟฟ้าที่จัดเก็บจากผู้ใช้ไฟ',
    allegation:'ยักยอกเงินค่าไฟฟ้าที่จัดเก็บจากผู้ใช้ไฟไปใช้ประโยชน์ส่วนตัวโดยไม่นำส่งหน่วยงาน ต่อเนื่องหลายเดือน',
    legalBase:'ม.18/4', complainant:'ฝ่ายตรวจสอบภายในหน่วยงาน (ผู้ร้อง)', owner:'นางสาวอังคณา ตรวจสอบบัญชี (เจ้าพนักงานป้องกันการทุจริตชำนาญการ)', ownerOrg:'กองปราบปรามการทุจริตในภาครัฐ 4',
    receivedDate:'2026-05-10', prescription:'2029-05-10', docRef:'ปป 0021/9221 ลงวันที่ 10 พฤษภาคม 2569', urgent:false, status:'104',
    accused:{ name:'นางสาวรุ่งนภา เก็บเงินไฟ', pos:'พนักงานจัดเก็บรายได้', idcard:'3-1210-0xxxx-xx-x', agency:'การไฟฟ้าส่วนภูมิภาคสาขาแห่งหนึ่ง' } },
  { id:'9222/2569', subject:'รายงานการไต่สวนข้อเท็จจริงเพื่อวินิจฉัยชี้มูล กรณีเจ้าหน้าที่สำนักงานพัฒนาสังคมและความมั่นคงของมนุษย์จังหวัดแห่งหนึ่ง ยักยอกเงินสงเคราะห์ผู้ยากไร้',
    allegation:'จัดทำบัญชีรายชื่อผู้รับเงินสงเคราะห์ผู้ยากไร้อันเป็นเท็จ แล้วเบิกจ่ายเงินไปใช้ประโยชน์ส่วนตัว รวมหลายราย',
    legalBase:'ม.18/4', complainant:'ผู้รับสิทธิ์สวัสดิการที่ไม่ได้รับเงิน (ผู้ร้อง)', owner:'นายธนกร คุ้มครองสิทธิ์ (นิติกรปฏิบัติการ)', ownerOrg:'กองปราบปรามการทุจริตในภาครัฐ 7',
    receivedDate:'2026-06-15', prescription:'2029-06-15', docRef:'ปป 0021/9222 ลงวันที่ 15 มิถุนายน 2569', urgent:false, status:'104',
    accused:{ name:'นางสาวมาลี เบียดบังเงิน', pos:'นักพัฒนาสังคมชำนาญการ', idcard:'3-1220-0xxxx-xx-x', agency:'สำนักงานพัฒนาสังคมและความมั่นคงของมนุษย์จังหวัดแห่งหนึ่ง' } }
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
      tcc_doc_ref: c.docRef, tcc_doc_type: '644', tcc_urgent: c.urgent, tcc_complex: false
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
      tcc_id: tccId, trr_status: c.status, trr_urgent: c.urgent,
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
