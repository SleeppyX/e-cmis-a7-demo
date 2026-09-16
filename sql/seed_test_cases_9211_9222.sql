-- ==========================================================================
-- เพิ่มเคสทดสอบ 12 รายการ (9211-9222/2569) ต่อจากชุด 9201-9210/2569 เดิม
-- 9211-9216/2569: สาย 7.1 ไต่สวนเบื้องต้น (PENDING_SECGEN) 3 ด่วน + 3 ไม่ด่วน
-- 9217-9222/2569: สาย 7.2 วินิจฉัยชี้มูล (PENDING_SECGEN_72) 3 ด่วน + 3 ไม่ด่วน
--
-- คู่กับ mock entry ใน assets/ecmis-app.js (CASES array) — inbox.html อ่านจาก
-- Supabase (tbl_res_request/tbl_cmp_case) โดยตรงผ่าน loadCasesFromSupabase()
-- เท่านั้น จึงต้อง insert แถวจริงที่นี่ด้วยถึงจะเห็นในหน้ารายการของเลขาธิการฯ
--
-- หมายเหตุ: tcc_legal_base มี CHECK constraint รับแค่ 'ม.18/4'/'ม.62' เท่านั้น
-- เคสสาย 7.2 (มี legalBase เป็น 'ม.24 วรรคท้าย' ใน mock) จึง normalize เป็น
-- 'ม.18/4' ตอน insert เหมือนที่ 9203/9204/2569 ทำไว้ก่อนหน้า
--
-- รันจริงผ่าน scripts/seed-cases-9211-9222.js (REST API ด้วย anon key เดียว
-- กับที่แอปใช้) ไฟล์นี้เก็บไว้เป็นเอกสารอ้างอิง/reproducible ตาม pattern เดิม
-- ของโปรเจกต์ (sql/seed_test_cases_secgen_entry.sql,
-- sql/seed_test_cases_71_secgen_batch2.sql)
-- ==========================================================================

-- 1) 9211/2569 — 7.1 เบื้องต้น ด่วน (ม.18/4)
WITH c AS (
  INSERT INTO public.tbl_cmp_case
    (tcc_no, tcc_subject, tcc_allegation, tcc_legal_base, tcc_complainant, tcc_owner, tcc_owner_org,
     tcc_received_date, tcc_prescription_date, tcc_doc_ref, tcc_doc_type, tcc_urgent, tcc_complex)
  VALUES
    ('9211/2569', 'กล่าวหาเจ้าหน้าที่เทศบาลนครแห่งหนึ่ง เรียกรับเงินจากผู้ประกอบการก่อสร้างเพื่อออกใบอนุญาตก่อสร้างอาคารสูง ใกล้ขาดอายุความ',
     'เรียกรับเงินจากผู้ประกอบการก่อสร้างเป็นการตอบแทนการออกใบอนุญาตก่อสร้างอาคารสูง คดีใกล้ครบกำหนดอายุความ',
     'ม.18/4', 'ผู้ประกอบการก่อสร้างในพื้นที่ (ผู้ร้อง)', 'นายกิตติศักดิ์ มั่นคงธรรม', 'สำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ เขต 8',
     '2026-01-12', '2026-10-14', 'ปป 0021/9211 ลงวันที่ 12 มกราคม 2569', '644', true, false)
  RETURNING tcc_id
), a AS (
  INSERT INTO public.tbl_cmp_case_accused (tcc_id, tcca_no, tcca_name, tcca_position, tcca_idcard, tcca_agency)
  SELECT tcc_id, 1, 'นายประสิทธิ์ ออกใบอนุญาต', 'ผู้อำนวยการกองช่าง เทศบาลนคร', '3-1110-0xxxx-xx-x', 'เทศบาลนครแห่งหนึ่ง' FROM c
)
INSERT INTO public.tbl_res_request (tcc_id, trr_status, trr_urgent, trr_signed_secgen, trr_sub_committee)
SELECT tcc_id, '005', true, false, NULL FROM c;

-- 2) 9212/2569 — 7.1 เบื้องต้น ด่วน (ม.62)
WITH c AS (
  INSERT INTO public.tbl_cmp_case
    (tcc_no, tcc_subject, tcc_allegation, tcc_legal_base, tcc_complainant, tcc_owner, tcc_owner_org,
     tcc_received_date, tcc_prescription_date, tcc_doc_ref, tcc_doc_type, tcc_urgent, tcc_complex)
  VALUES
    ('9212/2569', 'กล่าวหาเจ้าหน้าที่องค์การบริหารส่วนจังหวัดแห่งหนึ่ง ทุจริตการจัดซื้อจัดจ้างครุภัณฑ์การแพทย์ ใกล้ขาดอายุความ',
     'ร่วมกันกำหนดสเปกและฮั้วประมูลการจัดซื้อครุภัณฑ์การแพทย์ เอื้อประโยชน์ให้บริษัทเอกชนรายหนึ่ง คดีใกล้ครบกำหนดอายุความ',
     'ม.62', 'เจ้าหน้าที่พัสดุภายในหน่วยงาน (ผู้ร้อง)', 'นางสาวรัชนี ตรวจสอบ', 'สำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ เขต 1',
     '2026-02-08', '2026-10-22', 'ปป 0021/9212 ลงวันที่ 8 กุมภาพันธ์ 2569', '644', true, false)
  RETURNING tcc_id
), a AS (
  INSERT INTO public.tbl_cmp_case_accused (tcc_id, tcca_no, tcca_name, tcca_position, tcca_idcard, tcca_agency)
  SELECT tcc_id, 1, 'นายอนันต์ ฮั้วประมูล', 'หัวหน้าฝ่ายพัสดุ องค์การบริหารส่วนจังหวัด', '3-1120-0xxxx-xx-x', 'องค์การบริหารส่วนจังหวัดแห่งหนึ่ง' FROM c
)
INSERT INTO public.tbl_res_request (tcc_id, trr_status, trr_urgent, trr_signed_secgen, trr_sub_committee)
SELECT tcc_id, '005', true, false, NULL FROM c;

-- 3) 9213/2569 — 7.1 เบื้องต้น ด่วน (ม.18/4)
WITH c AS (
  INSERT INTO public.tbl_cmp_case
    (tcc_no, tcc_subject, tcc_allegation, tcc_legal_base, tcc_complainant, tcc_owner, tcc_owner_org,
     tcc_received_date, tcc_prescription_date, tcc_doc_ref, tcc_doc_type, tcc_urgent, tcc_complex)
  VALUES
    ('9213/2569', 'กล่าวหาเจ้าหน้าที่สำนักงานโยธาธิการและผังเมืองจังหวัดแห่งหนึ่ง เรียกรับเงินเพื่อออกใบอนุญาตจัดสรรที่ดิน ใกล้ขาดอายุความ',
     'เรียกรับเงินจากผู้ประกอบการเพื่อออกใบอนุญาตจัดสรรที่ดินโดยไม่ตรวจสอบผังเมืองตามระเบียบ คดีใกล้ครบกำหนดอายุความ',
     'ม.18/4', 'ผู้ประกอบการจัดสรรที่ดิน (ผู้ร้อง)', 'นายชาญวิทย์ รักษ์กฎหมาย', 'สำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ เขต 2',
     '2026-03-20', '2026-10-27', 'ปป 0021/9213 ลงวันที่ 20 มีนาคม 2569', '644', true, false)
  RETURNING tcc_id
), a AS (
  INSERT INTO public.tbl_cmp_case_accused (tcc_id, tcca_no, tcca_name, tcca_position, tcca_idcard, tcca_agency)
  SELECT tcc_id, 1, 'นายพิเชษฐ์ ผังเมือง', 'หัวหน้ากลุ่มงานควบคุมอาคาร', '3-1130-0xxxx-xx-x', 'สำนักงานโยธาธิการและผังเมืองจังหวัดแห่งหนึ่ง' FROM c
)
INSERT INTO public.tbl_res_request (tcc_id, trr_status, trr_urgent, trr_signed_secgen, trr_sub_committee)
SELECT tcc_id, '005', true, false, NULL FROM c;

-- 4) 9214/2569 — 7.1 เบื้องต้น ไม่ด่วน (ม.62)
WITH c AS (
  INSERT INTO public.tbl_cmp_case
    (tcc_no, tcc_subject, tcc_allegation, tcc_legal_base, tcc_complainant, tcc_owner, tcc_owner_org,
     tcc_received_date, tcc_prescription_date, tcc_doc_ref, tcc_doc_type, tcc_urgent, tcc_complex)
  VALUES
    ('9214/2569', 'กล่าวหาเจ้าหน้าที่สำนักงานประมงจังหวัดแห่งหนึ่ง ยักยอกเงินอุดหนุนเกษตรกรผู้เพาะเลี้ยงสัตว์น้ำ',
     'ยักยอกเงินอุดหนุนโครงการส่งเสริมเกษตรกรผู้เพาะเลี้ยงสัตว์น้ำโดยจัดทำเอกสารเบิกจ่ายเท็จ รวมหลายราย',
     'ม.62', 'กลุ่มเกษตรกรผู้เพาะเลี้ยงสัตว์น้ำ (ผู้ร้อง)', 'นายวสันต์ ซื่อธรรม', 'สำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ เขต 3',
     '2026-04-15', '2029-04-15', 'ปป 0021/9214 ลงวันที่ 15 เมษายน 2569', '644', false, false)
  RETURNING tcc_id
), a AS (
  INSERT INTO public.tbl_cmp_case_accused (tcc_id, tcca_no, tcca_name, tcca_position, tcca_idcard, tcca_agency)
  SELECT tcc_id, 1, 'นางสาวสุกัญญา เบิกจ่ายเกิน', 'นักวิชาการประมงชำนาญการ', '3-1140-0xxxx-xx-x', 'สำนักงานประมงจังหวัดแห่งหนึ่ง' FROM c
)
INSERT INTO public.tbl_res_request (tcc_id, trr_status, trr_urgent, trr_signed_secgen, trr_sub_committee)
SELECT tcc_id, '005', false, false, NULL FROM c;

-- 5) 9215/2569 — 7.1 เบื้องต้น ไม่ด่วน (ม.18/4)
WITH c AS (
  INSERT INTO public.tbl_cmp_case
    (tcc_no, tcc_subject, tcc_allegation, tcc_legal_base, tcc_complainant, tcc_owner, tcc_owner_org,
     tcc_received_date, tcc_prescription_date, tcc_doc_ref, tcc_doc_type, tcc_urgent, tcc_complex)
  VALUES
    ('9215/2569', 'กล่าวหาเจ้าหน้าที่สำนักงานปศุสัตว์จังหวัดแห่งหนึ่ง ใช้อำนาจโดยมิชอบออกใบรับรองฟาร์มปศุสัตว์โดยไม่ตรวจสอบจริง',
     'ใช้อำนาจในตำแหน่งหน้าที่ออกใบรับรองมาตรฐานฟาร์มปศุสัตว์ให้แก่ผู้ประกอบการรายหนึ่งโดยไม่ได้ลงตรวจสอบสถานที่จริง',
     'ม.18/4', 'เกษตรกรผู้เลี้ยงสัตว์รายอื่นในพื้นที่ (ผู้ร้อง)', 'นางสาวนภาพร ตรงไปตรงมา', 'สำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ เขต 4',
     '2026-05-22', '2029-05-22', 'ปป 0021/9215 ลงวันที่ 22 พฤษภาคม 2569', '644', false, false)
  RETURNING tcc_id
), a AS (
  INSERT INTO public.tbl_cmp_case_accused (tcc_id, tcca_no, tcca_name, tcca_position, tcca_idcard, tcca_agency)
  SELECT tcc_id, 1, 'นายบรรจง รับรองเท็จ', 'นายสัตวแพทย์ชำนาญการ', '3-1150-0xxxx-xx-x', 'สำนักงานปศุสัตว์จังหวัดแห่งหนึ่ง' FROM c
)
INSERT INTO public.tbl_res_request (tcc_id, trr_status, trr_urgent, trr_signed_secgen, trr_sub_committee)
SELECT tcc_id, '005', false, false, NULL FROM c;

-- 6) 9216/2569 — 7.1 เบื้องต้น ไม่ด่วน (ม.62)
WITH c AS (
  INSERT INTO public.tbl_cmp_case
    (tcc_no, tcc_subject, tcc_allegation, tcc_legal_base, tcc_complainant, tcc_owner, tcc_owner_org,
     tcc_received_date, tcc_prescription_date, tcc_doc_ref, tcc_doc_type, tcc_urgent, tcc_complex)
  VALUES
    ('9216/2569', 'กล่าวหาเจ้าหน้าที่สำนักงานเกษตรจังหวัดแห่งหนึ่ง เรียกรับเงินจากเกษตรกรเพื่ออนุมัติสิทธิ์รับปุ๋ยอุดหนุนราคาพิเศษ',
     'เรียกรับเงินจากเกษตรกรเพื่อแลกกับการอนุมัติสิทธิ์เข้าร่วมโครงการปุ๋ยอุดหนุนราคาพิเศษของรัฐ รวมหลายราย',
     'ม.62', 'กลุ่มเกษตรกรในพื้นที่ (ผู้ร้อง)', 'นายทวีศักดิ์ มั่นในธรรม', 'สำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ เขต 5',
     '2026-06-10', '2029-06-10', 'ปป 0021/9216 ลงวันที่ 10 มิถุนายน 2569', '644', false, false)
  RETURNING tcc_id
), a AS (
  INSERT INTO public.tbl_cmp_case_accused (tcc_id, tcca_no, tcca_name, tcca_position, tcca_idcard, tcca_agency)
  SELECT tcc_id, 1, 'นายสมบูรณ์ ปุ๋ยพิเศษ', 'นักวิชาการส่งเสริมการเกษตรชำนาญการ', '3-1160-0xxxx-xx-x', 'สำนักงานเกษตรจังหวัดแห่งหนึ่ง' FROM c
)
INSERT INTO public.tbl_res_request (tcc_id, trr_status, trr_urgent, trr_signed_secgen, trr_sub_committee)
SELECT tcc_id, '005', false, false, NULL FROM c;

-- 7) 9217/2569 — 7.2 ชี้มูล ด่วน (legal_base normalize เป็น ม.18/4)
WITH c AS (
  INSERT INTO public.tbl_cmp_case
    (tcc_no, tcc_subject, tcc_allegation, tcc_legal_base, tcc_complainant, tcc_owner, tcc_owner_org,
     tcc_received_date, tcc_prescription_date, tcc_doc_ref, tcc_doc_type, tcc_urgent, tcc_complex)
  VALUES
    ('9217/2569', 'รายงานการไต่สวนข้อเท็จจริงเพื่อวินิจฉัยชี้มูล กรณีเจ้าหน้าที่หน่วยป้องกันรักษาป่าแห่งหนึ่ง เรียกรับเงินแลกใบอนุญาตทำไม้ ใกล้ขาดอายุความ',
     'เรียกรับเงินจากผู้ประกอบการเพื่อออกใบอนุญาตทำไม้ในเขตป่าสงวนแห่งชาติโดยมิชอบ เอื้อประโยชน์ให้เอกชนหลายราย คดีใกล้ครบกำหนดอายุความ',
     'ม.18/4', 'ราษฎรในพื้นที่ป่าอนุรักษ์ (ผู้ร้อง)', 'นายเอกชัย รักษาป่า (นิติกรชำนาญการ)', 'กองปราบปรามการทุจริตในภาครัฐ 5',
     '2026-01-25', '2026-10-19', 'ปป 0021/9217 ลงวันที่ 25 มกราคม 2569', '644', true, false)
  RETURNING tcc_id
), a AS (
  INSERT INTO public.tbl_cmp_case_accused (tcc_id, tcca_no, tcca_name, tcca_position, tcca_idcard, tcca_agency)
  SELECT tcc_id, 1, 'นายสมโภชน์ ทำไม้', 'หัวหน้าหน่วยป้องกันรักษาป่า', '3-1170-0xxxx-xx-x', 'หน่วยป้องกันรักษาป่าแห่งหนึ่ง' FROM c
)
INSERT INTO public.tbl_res_request (tcc_id, trr_status, trr_urgent, trr_signed_secgen, trr_sub_committee)
SELECT tcc_id, '104', true, false, NULL FROM c;

-- 8) 9218/2569 — 7.2 ชี้มูล ด่วน
WITH c AS (
  INSERT INTO public.tbl_cmp_case
    (tcc_no, tcc_subject, tcc_allegation, tcc_legal_base, tcc_complainant, tcc_owner, tcc_owner_org,
     tcc_received_date, tcc_prescription_date, tcc_doc_ref, tcc_doc_type, tcc_urgent, tcc_complex)
  VALUES
    ('9218/2569', 'รายงานการไต่สวนข้อเท็จจริงเพื่อวินิจฉัยชี้มูล กรณีเจ้าหน้าที่สำนักงานสรรพากรพื้นที่แห่งหนึ่ง เรียกรับเงินแลกลดหย่อนภาษี ใกล้ขาดอายุความ',
     'เรียกรับเงินจากผู้ประกอบการเพื่อแลกกับการลดหย่อนการประเมินภาษีและละเว้นการตรวจสอบบัญชี คดีใกล้ครบกำหนดอายุความ',
     'ม.18/4', 'ผู้ประกอบการที่ถูกเรียกรับเงิน (ผู้ร้อง)', 'นางสาวพรทิพย์ ตรวจภาษี (เจ้าพนักงานป้องกันการทุจริตชำนาญการ)', 'กองปราบปรามการทุจริตในภาครัฐ 1',
     '2026-02-18', '2026-10-13', 'ปป 0021/9218 ลงวันที่ 18 กุมภาพันธ์ 2569', '644', true, false)
  RETURNING tcc_id
), a AS (
  INSERT INTO public.tbl_cmp_case_accused (tcc_id, tcca_no, tcca_name, tcca_position, tcca_idcard, tcca_agency)
  SELECT tcc_id, 1, 'นายอำนาจ ลดหย่อนให้', 'สรรพากรพื้นที่สาขา', '3-1180-0xxxx-xx-x', 'สำนักงานสรรพากรพื้นที่แห่งหนึ่ง' FROM c
)
INSERT INTO public.tbl_res_request (tcc_id, trr_status, trr_urgent, trr_signed_secgen, trr_sub_committee)
SELECT tcc_id, '104', true, false, NULL FROM c;

-- 9) 9219/2569 — 7.2 ชี้มูล ด่วน
WITH c AS (
  INSERT INTO public.tbl_cmp_case
    (tcc_no, tcc_subject, tcc_allegation, tcc_legal_base, tcc_complainant, tcc_owner, tcc_owner_org,
     tcc_received_date, tcc_prescription_date, tcc_doc_ref, tcc_doc_type, tcc_urgent, tcc_complex)
  VALUES
    ('9219/2569', 'รายงานการไต่สวนข้อเท็จจริงเพื่อวินิจฉัยชี้มูล กรณีเจ้าหน้าที่สำนักงานจัดหางานจังหวัดแห่งหนึ่ง เรียกรับเงินค่าธรรมเนียมอนุญาตทำงานเกินอัตรา ใกล้ขาดอายุความ',
     'เรียกเก็บค่าธรรมเนียมการออกใบอนุญาตทำงานของแรงงานต่างด้าวเกินอัตราที่กฎหมายกำหนด นำเงินส่วนต่างเข้ากระเป๋าตนเอง รวมหลายราย คดีใกล้ครบกำหนดอายุความ',
     'ม.18/4', 'แรงงานต่างด้าวที่ถูกเรียกเก็บเงิน (ผู้ร้อง)', 'นายกฤษดา จัดหางานสุจริต (นิติกรปฏิบัติการ)', 'กองปราบปรามการทุจริตในภาครัฐ 6',
     '2026-03-05', '2026-10-30', 'ปป 0021/9219 ลงวันที่ 5 มีนาคม 2569', '644', true, false)
  RETURNING tcc_id
), a AS (
  INSERT INTO public.tbl_cmp_case_accused (tcc_id, tcca_no, tcca_name, tcca_position, tcca_idcard, tcca_agency)
  SELECT tcc_id, 1, 'นายประยุทธ เก็บค่าธรรมเนียม', 'เจ้าพนักงานแรงงานชำนาญงาน', '3-1190-0xxxx-xx-x', 'สำนักงานจัดหางานจังหวัดแห่งหนึ่ง' FROM c
)
INSERT INTO public.tbl_res_request (tcc_id, trr_status, trr_urgent, trr_signed_secgen, trr_sub_committee)
SELECT tcc_id, '104', true, false, NULL FROM c;

-- 10) 9220/2569 — 7.2 ชี้มูล ไม่ด่วน
WITH c AS (
  INSERT INTO public.tbl_cmp_case
    (tcc_no, tcc_subject, tcc_allegation, tcc_legal_base, tcc_complainant, tcc_owner, tcc_owner_org,
     tcc_received_date, tcc_prescription_date, tcc_doc_ref, tcc_doc_type, tcc_urgent, tcc_complex)
  VALUES
    ('9220/2569', 'รายงานการไต่สวนข้อเท็จจริงเพื่อวินิจฉัยชี้มูล กรณีเจ้าหน้าที่การประปาส่วนภูมิภาคสาขาแห่งหนึ่ง ฮั้วประมูลจัดซื้อท่อประปา',
     'ร่วมกันกำหนดคุณสมบัติผู้เสนอราคาและฮั้วประมูลการจัดซื้อท่อประปาให้แก่พวกพ้อง เป็นเหตุให้ทางราชการเสียหาย',
     'ม.18/4', 'ผู้เสนอราคารายอื่นที่ไม่ได้รับความเป็นธรรม (ผู้ร้อง)', 'นายวิชัย ตรวจการประปา (นิติกรชำนาญการ)', 'กองปราบปรามการทุจริตในภาครัฐ 3',
     '2026-04-28', '2029-04-28', 'ปป 0021/9220 ลงวันที่ 28 เมษายน 2569', '644', false, false)
  RETURNING tcc_id
), a AS (
  INSERT INTO public.tbl_cmp_case_accused (tcc_id, tcca_no, tcca_name, tcca_position, tcca_idcard, tcca_agency)
  SELECT tcc_id, 1, 'นายสุรพล ฮั้วท่อ', 'ผู้จัดการการประปาส่วนภูมิภาคสาขา', '3-1200-0xxxx-xx-x', 'การประปาส่วนภูมิภาคสาขาแห่งหนึ่ง' FROM c
)
INSERT INTO public.tbl_res_request (tcc_id, trr_status, trr_urgent, trr_signed_secgen, trr_sub_committee)
SELECT tcc_id, '104', false, false, NULL FROM c;

-- 11) 9221/2569 — 7.2 ชี้มูล ไม่ด่วน
WITH c AS (
  INSERT INTO public.tbl_cmp_case
    (tcc_no, tcc_subject, tcc_allegation, tcc_legal_base, tcc_complainant, tcc_owner, tcc_owner_org,
     tcc_received_date, tcc_prescription_date, tcc_doc_ref, tcc_doc_type, tcc_urgent, tcc_complex)
  VALUES
    ('9221/2569', 'รายงานการไต่สวนข้อเท็จจริงเพื่อวินิจฉัยชี้มูล กรณีเจ้าหน้าที่การไฟฟ้าส่วนภูมิภาคสาขาแห่งหนึ่ง ยักยอกเงินค่าไฟฟ้าที่จัดเก็บจากผู้ใช้ไฟ',
     'ยักยอกเงินค่าไฟฟ้าที่จัดเก็บจากผู้ใช้ไฟไปใช้ประโยชน์ส่วนตัวโดยไม่นำส่งหน่วยงาน ต่อเนื่องหลายเดือน',
     'ม.18/4', 'ฝ่ายตรวจสอบภายในหน่วยงาน (ผู้ร้อง)', 'นางสาวอังคณา ตรวจสอบบัญชี (เจ้าพนักงานป้องกันการทุจริตชำนาญการ)', 'กองปราบปรามการทุจริตในภาครัฐ 4',
     '2026-05-10', '2029-05-10', 'ปป 0021/9221 ลงวันที่ 10 พฤษภาคม 2569', '644', false, false)
  RETURNING tcc_id
), a AS (
  INSERT INTO public.tbl_cmp_case_accused (tcc_id, tcca_no, tcca_name, tcca_position, tcca_idcard, tcca_agency)
  SELECT tcc_id, 1, 'นางสาวรุ่งนภา เก็บเงินไฟ', 'พนักงานจัดเก็บรายได้', '3-1210-0xxxx-xx-x', 'การไฟฟ้าส่วนภูมิภาคสาขาแห่งหนึ่ง' FROM c
)
INSERT INTO public.tbl_res_request (tcc_id, trr_status, trr_urgent, trr_signed_secgen, trr_sub_committee)
SELECT tcc_id, '104', false, false, NULL FROM c;

-- 12) 9222/2569 — 7.2 ชี้มูล ไม่ด่วน
WITH c AS (
  INSERT INTO public.tbl_cmp_case
    (tcc_no, tcc_subject, tcc_allegation, tcc_legal_base, tcc_complainant, tcc_owner, tcc_owner_org,
     tcc_received_date, tcc_prescription_date, tcc_doc_ref, tcc_doc_type, tcc_urgent, tcc_complex)
  VALUES
    ('9222/2569', 'รายงานการไต่สวนข้อเท็จจริงเพื่อวินิจฉัยชี้มูล กรณีเจ้าหน้าที่สำนักงานพัฒนาสังคมและความมั่นคงของมนุษย์จังหวัดแห่งหนึ่ง ยักยอกเงินสงเคราะห์ผู้ยากไร้',
     'จัดทำบัญชีรายชื่อผู้รับเงินสงเคราะห์ผู้ยากไร้อันเป็นเท็จ แล้วเบิกจ่ายเงินไปใช้ประโยชน์ส่วนตัว รวมหลายราย',
     'ม.18/4', 'ผู้รับสิทธิ์สวัสดิการที่ไม่ได้รับเงิน (ผู้ร้อง)', 'นายธนกร คุ้มครองสิทธิ์ (นิติกรปฏิบัติการ)', 'กองปราบปรามการทุจริตในภาครัฐ 7',
     '2026-06-15', '2029-06-15', 'ปป 0021/9222 ลงวันที่ 15 มิถุนายน 2569', '644', false, false)
  RETURNING tcc_id
), a AS (
  INSERT INTO public.tbl_cmp_case_accused (tcc_id, tcca_no, tcca_name, tcca_position, tcca_idcard, tcca_agency)
  SELECT tcc_id, 1, 'นางสาวมาลี เบียดบังเงิน', 'นักพัฒนาสังคมชำนาญการ', '3-1220-0xxxx-xx-x', 'สำนักงานพัฒนาสังคมและความมั่นคงของมนุษย์จังหวัดแห่งหนึ่ง' FROM c
)
INSERT INTO public.tbl_res_request (tcc_id, trr_status, trr_urgent, trr_signed_secgen, trr_sub_committee)
SELECT tcc_id, '104', false, false, NULL FROM c;
