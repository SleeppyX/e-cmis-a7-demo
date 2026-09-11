-- ==========================================================================
-- เพิ่มเคสทดสอบเริ่มต้นที่เลขาธิการฯ (PENDING_SECGEN / PENDING_SECGEN_72)
-- ครบ 5 combo: 7.1 ไม่ด่วน, 7.1 ด่วน, 7.2 ไม่ด่วน, 7.2 ด่วน, 7.3 ทั่วไป
--
-- คู่กับเคสที่เพิ่มไว้ใน assets/ecmis-app.js (CASES array) — inbox.html ไม่ได้
-- อ่านจาก static array นั้นเลย อ่านจาก Supabase (tbl_res_request/tbl_cmp_case)
-- โดยตรงผ่าน loadCasesFromSupabase() เท่านั้น จึงต้อง insert แถวจริงที่นี่
-- ด้วยถึงจะเห็นในหน้ารายการของเลขาธิการฯ
--
-- หมายเหตุ: tcc_legal_base มี CHECK constraint รับแค่ 'ม.18/4'/'ม.62' เท่านั้น
-- (พบจาก sql/resync_cases_with_supabase.sql ที่ทำมาก่อนหน้า) จึงใช้ 'ม.18/4'
-- ทั้ง 5 เคสแทนค่าที่ใช้ใน static array (ม.24 วรรคท้าย / ระเบียบฯ)
-- ==========================================================================

-- 1) 9201/2569 — 7.1 เบื้องต้น ไม่ด่วน
WITH c AS (
  INSERT INTO public.tbl_cmp_case
    (tcc_no, tcc_subject, tcc_allegation, tcc_legal_base, tcc_complainant, tcc_owner, tcc_owner_org,
     tcc_received_date, tcc_prescription_date, tcc_doc_ref, tcc_doc_type, tcc_urgent, tcc_complex)
  VALUES
    ('9201/2569', 'กล่าวหาเจ้าหน้าที่องค์การบริหารส่วนตำบลแห่งหนึ่ง เรียกรับผลประโยชน์จากผู้ประกอบการก่อนอนุมัติใบอนุญาต',
     'เรียกรับเงินจากผู้ประกอบการเป็นการตอบแทนการอนุมัติใบอนุญาตประกอบกิจการ รวม 3 ราย',
     'ม.18/4', 'ผู้ประกอบการในพื้นที่ (ผู้ร้อง)', 'นายสมชาย ใจซื่อ', 'สำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ เขต 1',
     '2026-08-01', '2029-12-01', 'ปป 0021/9201 ลงวันที่ 1 สิงหาคม 2569', '644', false, false)
  RETURNING tcc_id
), a AS (
  INSERT INTO public.tbl_cmp_case_accused (tcc_id, tcca_no, tcca_name, tcca_position, tcca_idcard, tcca_agency)
  SELECT tcc_id, 1, 'นายประดิษฐ์ มากเงิน', 'ปลัดองค์การบริหารส่วนตำบล', '3-1010-0xxxx-xx-x', 'องค์การบริหารส่วนตำบลแห่งหนึ่ง' FROM c
)
INSERT INTO public.tbl_res_request (tcc_id, trr_status, trr_urgent, trr_signed_secgen, trr_sub_committee)
SELECT tcc_id, '005', false, false, NULL FROM c;

-- 2) 9202/2569 — 7.1 เบื้องต้น ด่วน
WITH c AS (
  INSERT INTO public.tbl_cmp_case
    (tcc_no, tcc_subject, tcc_allegation, tcc_legal_base, tcc_complainant, tcc_owner, tcc_owner_org,
     tcc_received_date, tcc_prescription_date, tcc_doc_ref, tcc_doc_type, tcc_urgent, tcc_complex)
  VALUES
    ('9202/2569', 'กล่าวหาเจ้าหน้าที่กรมทางหลวงชนบทแห่งหนึ่ง เร่งรัดเบิกจ่ายเงินงบประมาณก่อสร้างถนนก่อนตรวจรับงานจริง ใกล้ขาดอายุความ',
     'อนุมัติเบิกจ่ายเงินงบประมาณโครงการก่อสร้างถนนทั้งที่งานยังไม่แล้วเสร็จตามสัญญา คดีใกล้ครบกำหนดอายุความ',
     'ม.18/4', 'ผู้ตรวจสอบภายในหน่วยงาน (ผู้ร้อง)', 'นางสาวปรียา ตั้งมั่น', 'สำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ เขต 2',
     '2026-06-01', '2026-10-15', 'ปป 0021/9202 ลงวันที่ 1 มิถุนายน 2569', '644', true, false)
  RETURNING tcc_id
), a AS (
  INSERT INTO public.tbl_cmp_case_accused (tcc_id, tcca_no, tcca_name, tcca_position, tcca_idcard, tcca_agency)
  SELECT tcc_id, 1, 'นายวิรัตน์ เร่งรัด', 'ผู้อำนวยการแขวงทางหลวงชนบท', '3-1020-0xxxx-xx-x', 'กรมทางหลวงชนบทแห่งหนึ่ง' FROM c
)
INSERT INTO public.tbl_res_request (tcc_id, trr_status, trr_urgent, trr_signed_secgen, trr_sub_committee)
SELECT tcc_id, '005', true, false, NULL FROM c;

-- 3) 9203/2569 — 7.2 ชี้มูล ไม่ด่วน
WITH c AS (
  INSERT INTO public.tbl_cmp_case
    (tcc_no, tcc_subject, tcc_allegation, tcc_legal_base, tcc_complainant, tcc_owner, tcc_owner_org,
     tcc_received_date, tcc_prescription_date, tcc_doc_ref, tcc_doc_type, tcc_urgent, tcc_complex)
  VALUES
    ('9203/2569', 'รายงานการไต่สวนข้อเท็จจริงเพื่อวินิจฉัยชี้มูล กรณีกล่าวหาเจ้าหน้าที่สำนักงานที่ดินจังหวัดแห่งหนึ่ง ออกโฉนดทับที่สาธารณประโยชน์',
     'ออกโฉนดที่ดินทับที่สาธารณประโยชน์โดยมิชอบ เอื้อประโยชน์ให้เอกชนรายหนึ่งเข้าครอบครองพื้นที่',
     'ม.18/4', 'ราษฎรในพื้นที่ (ผู้ร้อง)', 'นายอภิสิทธิ์ สุจริตกร (นิติกรปฏิบัติการ)', 'กองปราบปรามการทุจริตในภาครัฐ 4',
     '2026-04-10', '2030-04-10', 'ปป 0021/9203 ลงวันที่ 10 เมษายน 2569', '644', false, false)
  RETURNING tcc_id
), a AS (
  INSERT INTO public.tbl_cmp_case_accused (tcc_id, tcca_no, tcca_name, tcca_position, tcca_idcard, tcca_agency)
  SELECT tcc_id, 1, 'นายบุญมี ออกโฉนด', 'เจ้าพนักงานที่ดินจังหวัด', '3-1030-0xxxx-xx-x', 'สำนักงานที่ดินจังหวัดแห่งหนึ่ง' FROM c
)
INSERT INTO public.tbl_res_request (tcc_id, trr_status, trr_urgent, trr_signed_secgen, trr_sub_committee)
SELECT tcc_id, '104', false, false, NULL FROM c;

-- 4) 9204/2569 — 7.2 ชี้มูล ด่วน
WITH c AS (
  INSERT INTO public.tbl_cmp_case
    (tcc_no, tcc_subject, tcc_allegation, tcc_legal_base, tcc_complainant, tcc_owner, tcc_owner_org,
     tcc_received_date, tcc_prescription_date, tcc_doc_ref, tcc_doc_type, tcc_urgent, tcc_complex)
  VALUES
    ('9204/2569', 'รายงานการไต่สวนข้อเท็จจริงเพื่อวินิจฉัยชี้มูล กรณีเจ้าหน้าที่คลังจังหวัดแห่งหนึ่ง ยักยอกเงินภาษี ใกล้ขาดอายุความ',
     'ยักยอกเงินภาษีที่จัดเก็บได้ไปใช้ประโยชน์ส่วนตัวต่อเนื่องหลายเดือน คดีใกล้ครบกำหนดอายุความ',
     'ม.18/4', 'สำนักงานคลังจังหวัด (ผู้ร้อง)', 'นายวรพล ตรวจสอบ (เจ้าพนักงานป้องกันการทุจริตชำนาญการ)', 'กองปราบปรามการทุจริตในภาครัฐ 2',
     '2026-03-05', '2026-10-20', 'ปป 0021/9204 ลงวันที่ 5 มีนาคม 2569', '644', true, false)
  RETURNING tcc_id
), a AS (
  INSERT INTO public.tbl_cmp_case_accused (tcc_id, tcca_no, tcca_name, tcca_position, tcca_idcard, tcca_agency)
  SELECT tcc_id, 1, 'นางสาวจิราพร เก็บเงิน', 'เจ้าพนักงานการเงินและบัญชีชำนาญงาน', '3-1040-0xxxx-xx-x', 'สำนักงานคลังจังหวัดแห่งหนึ่ง' FROM c
)
INSERT INTO public.tbl_res_request (tcc_id, trr_status, trr_urgent, trr_signed_secgen, trr_sub_committee)
SELECT tcc_id, '104', true, false, NULL FROM c;

-- 5) กจ.201/2569 — 7.3 เรื่องทั่วไป (ไม่มีผู้ถูกกล่าวหา)
WITH c AS (
  INSERT INTO public.tbl_cmp_case
    (tcc_no, tcc_subject, tcc_allegation, tcc_legal_base, tcc_complainant, tcc_owner, tcc_owner_org,
     tcc_received_date, tcc_prescription_date, tcc_doc_ref, tcc_doc_type, tcc_urgent, tcc_complex)
  VALUES
    ('กจ.201/2569', 'ขออนุมัติแต่งตั้งคณะทำงานเฉพาะกิจตรวจสอบข้อเท็จจริงกรณีร้องเรียนหน่วยงานภาครัฐจัดซื้อจัดจ้างล่าช้าผิดปกติ (กิจกรรม 7.3)',
     'พบความล่าช้าผิดปกติในการจัดซื้อจัดจ้างหลายหน่วยงานภาครัฐในช่วงเวลาใกล้เคียงกัน จึงเห็นควรแต่งตั้งคณะทำงานเฉพาะกิจตรวจสอบข้อเท็จจริงเบื้องต้นก่อนพิจารณาดำเนินการต่อไป',
     'ม.18/4', 'กลุ่มงานกิจการคณะกรรมการ (เสนอตามภารกิจ)', 'กลุ่มงานกิจการคณะกรรมการ', 'กองบริหารคดี',
     '2026-08-05', NULL, 'กจ 0001/0201 ลงวันที่ 5 สิงหาคม 2569', '213', false, false)
  RETURNING tcc_id
)
INSERT INTO public.tbl_res_request (tcc_id, trr_status, trr_urgent, trr_signed_secgen, trr_sub_committee)
SELECT tcc_id, '005', false, false, NULL FROM c;
