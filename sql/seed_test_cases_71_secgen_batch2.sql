-- ==========================================================================
-- เพิ่มเคสทดสอบ 7.1 ไต่สวนเบื้องต้น 5 รายการที่เลขาธิการฯ (PENDING_SECGEN)
-- ผสมด่วน/ไม่ด่วน 2/3 และมาตรา ม.18/4 / ม.62 ผสมกัน — ต่อจากชุด
-- seed_test_cases_secgen_entry.sql (9201-9204/2569) ด้วยเลขคดี 9206-9210/2569
-- (ข้าม 9205/2569 เพราะมีเคสทดสอบเดิมใช้เลขนี้อยู่แล้วใน Supabase)
--
-- คู่กับ mock entry ใน assets/ecmis-app.js (CASES array) — inbox.html อ่านจาก
-- Supabase (tbl_res_request/tbl_cmp_case) โดยตรงผ่าน loadCasesFromSupabase()
-- เท่านั้น จึงต้อง insert แถวจริงที่นี่ด้วยถึงจะเห็นในหน้ารายการของเลขาธิการฯ
--
-- ตั้งใจไม่ตั้งค่า trr_sub_committee ล่วงหน้า (เป็น NULL ทุกเคส) เพราะที่ชั้น
-- เลขาธิการฯ (PENDING_SECGEN) ยังไม่ถึงขั้นตอนกองบริหารคดีจัดเข้าคณะอนุกลั่นกรอง
-- ==========================================================================

-- 1) 9210/2569 — 7.1 เบื้องต้น ไม่ด่วน (ม.18/4)
WITH c AS (
  INSERT INTO public.tbl_cmp_case
    (tcc_no, tcc_subject, tcc_allegation, tcc_legal_base, tcc_complainant, tcc_owner, tcc_owner_org,
     tcc_received_date, tcc_prescription_date, tcc_doc_ref, tcc_doc_type, tcc_urgent, tcc_complex)
  VALUES
    ('9210/2569', 'กล่าวหาเจ้าหน้าที่เทศบาลตำบลแห่งหนึ่ง เรียกรับเงินจากผู้รับเหมาก่อนเบิกจ่ายค่างานก่อสร้างศาลาประชาคม',
     'เรียกรับเงินจากผู้รับเหมาก่อสร้างเป็นการตอบแทนการเบิกจ่ายเงินค่างวดงานก่อสร้างศาลาประชาคม',
     'ม.18/4', 'ผู้รับเหมาก่อสร้าง (ผู้ร้อง)', 'นายสุรชัย มั่นคง', 'สำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ เขต 3',
     '2026-07-10', '2029-07-10', 'ปป 0021/9210 ลงวันที่ 10 กรกฎาคม 2569', '644', false, false)
  RETURNING tcc_id
), a AS (
  INSERT INTO public.tbl_cmp_case_accused (tcc_id, tcca_no, tcca_name, tcca_position, tcca_idcard, tcca_agency)
  SELECT tcc_id, 1, 'นายไพโรจน์ รับทรัพย์', 'ผู้อำนวยการกองช่าง เทศบาลตำบล', '3-1050-0xxxx-xx-x', 'เทศบาลตำบลแห่งหนึ่ง' FROM c
)
INSERT INTO public.tbl_res_request (tcc_id, trr_status, trr_urgent, trr_signed_secgen, trr_sub_committee)
SELECT tcc_id, '005', false, false, NULL FROM c;

-- 2) 9206/2569 — 7.1 เบื้องต้น ด่วน (ม.18/4)
WITH c AS (
  INSERT INTO public.tbl_cmp_case
    (tcc_no, tcc_subject, tcc_allegation, tcc_legal_base, tcc_complainant, tcc_owner, tcc_owner_org,
     tcc_received_date, tcc_prescription_date, tcc_doc_ref, tcc_doc_type, tcc_urgent, tcc_complex)
  VALUES
    ('9206/2569', 'กล่าวหาเจ้าหน้าที่สำนักงานสาธารณสุขจังหวัดแห่งหนึ่ง จัดซื้อเวชภัณฑ์ราคาสูงกว่าตลาดเอื้อประโยชน์บริษัทเอกชน ใกล้ขาดอายุความ',
     'จัดซื้อเวชภัณฑ์และครุภัณฑ์ทางการแพทย์ในราคาสูงกว่าท้องตลาดอย่างผิดปกติ เอื้อประโยชน์ให้บริษัทเอกชนรายหนึ่ง คดีใกล้ครบกำหนดอายุความ',
     'ม.18/4', 'เจ้าหน้าที่พัสดุภายในหน่วยงาน (ผู้ร้อง)', 'นางสาวพิมพ์ใจ ตรงต่อหน้าที่', 'สำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ เขต 4',
     '2026-05-15', '2026-11-01', 'ปป 0021/9206 ลงวันที่ 15 พฤษภาคม 2569', '644', true, false)
  RETURNING tcc_id
), a AS (
  INSERT INTO public.tbl_cmp_case_accused (tcc_id, tcca_no, tcca_name, tcca_position, tcca_idcard, tcca_agency)
  SELECT tcc_id, 1, 'นายเกรียงศักดิ์ จัดซื้อ', 'หัวหน้ากลุ่มงานพัสดุ สำนักงานสาธารณสุขจังหวัด', '3-1060-0xxxx-xx-x', 'สำนักงานสาธารณสุขจังหวัดแห่งหนึ่ง' FROM c
)
INSERT INTO public.tbl_res_request (tcc_id, trr_status, trr_urgent, trr_signed_secgen, trr_sub_committee)
SELECT tcc_id, '005', true, false, NULL FROM c;

-- 3) 9207/2569 — 7.1 เบื้องต้น ไม่ด่วน (ม.62)
WITH c AS (
  INSERT INTO public.tbl_cmp_case
    (tcc_no, tcc_subject, tcc_allegation, tcc_legal_base, tcc_complainant, tcc_owner, tcc_owner_org,
     tcc_received_date, tcc_prescription_date, tcc_doc_ref, tcc_doc_type, tcc_urgent, tcc_complex)
  VALUES
    ('9207/2569', 'กล่าวหาเจ้าหน้าที่สำนักงานขนส่งจังหวัดแห่งหนึ่ง เรียกรับเงินเพื่ออำนวยความสะดวกในการออกใบอนุญาตขับขี่',
     'เรียกรับเงินจากประชาชนผู้มาติดต่อขอรับใบอนุญาตขับรถเพื่อแลกกับการอำนวยความสะดวกและลัดคิว',
     'ม.62', 'ประชาชนผู้มาติดต่อราชการ (ผู้ร้อง)', 'นายธีรพงษ์ ซื่อสัตย์', 'สำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ เขต 5',
     '2026-07-20', '2029-07-20', 'ปป 0021/9207 ลงวันที่ 20 กรกฎาคม 2569', '644', false, false)
  RETURNING tcc_id
), a AS (
  INSERT INTO public.tbl_cmp_case_accused (tcc_id, tcca_no, tcca_name, tcca_position, tcca_idcard, tcca_agency)
  SELECT tcc_id, 1, 'นายสมพงษ์ เร่งงาน', 'นายทะเบียนใบอนุญาตขับรถ', '3-1070-0xxxx-xx-x', 'สำนักงานขนส่งจังหวัดแห่งหนึ่ง' FROM c
)
INSERT INTO public.tbl_res_request (tcc_id, trr_status, trr_urgent, trr_signed_secgen, trr_sub_committee)
SELECT tcc_id, '005', false, false, NULL FROM c;

-- 4) 9208/2569 — 7.1 เบื้องต้น ไม่ด่วน (ม.62)
WITH c AS (
  INSERT INTO public.tbl_cmp_case
    (tcc_no, tcc_subject, tcc_allegation, tcc_legal_base, tcc_complainant, tcc_owner, tcc_owner_org,
     tcc_received_date, tcc_prescription_date, tcc_doc_ref, tcc_doc_type, tcc_urgent, tcc_complex)
  VALUES
    ('9208/2569', 'กล่าวหาเจ้าหน้าที่โรงพยาบาลส่งเสริมสุขภาพตำบลแห่งหนึ่ง เบิกค่าตอบแทนเวรนอกเวลาราชการโดยไม่ได้ปฏิบัติงานจริง',
     'เบิกจ่ายค่าตอบแทนการปฏิบัติงานนอกเวลาราชการโดยไม่ได้มาปฏิบัติงานจริงตามที่เบิก รวมหลายครั้ง',
     'ม.62', 'เจ้าหน้าที่ภายในหน่วยงานเดียวกัน (ผู้ร้อง)', 'นางสาวอรทัย ตรวจตรา', 'สำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ เขต 6',
     '2026-08-02', '2029-08-02', 'ปป 0021/9208 ลงวันที่ 2 สิงหาคม 2569', '644', false, false)
  RETURNING tcc_id
), a AS (
  INSERT INTO public.tbl_cmp_case_accused (tcc_id, tcca_no, tcca_name, tcca_position, tcca_idcard, tcca_agency)
  SELECT tcc_id, 1, 'นางสาวกัลยา เบิกเกิน', 'พยาบาลวิชาชีพชำนาญการ', '3-1080-0xxxx-xx-x', 'โรงพยาบาลส่งเสริมสุขภาพตำบลแห่งหนึ่ง' FROM c
)
INSERT INTO public.tbl_res_request (tcc_id, trr_status, trr_urgent, trr_signed_secgen, trr_sub_committee)
SELECT tcc_id, '005', false, false, NULL FROM c;

-- 5) 9209/2569 — 7.1 เบื้องต้น ด่วน (ม.62)
WITH c AS (
  INSERT INTO public.tbl_cmp_case
    (tcc_no, tcc_subject, tcc_allegation, tcc_legal_base, tcc_complainant, tcc_owner, tcc_owner_org,
     tcc_received_date, tcc_prescription_date, tcc_doc_ref, tcc_doc_type, tcc_urgent, tcc_complex)
  VALUES
    ('9209/2569', 'กล่าวหาเจ้าหน้าที่สำนักงานที่ดินสาขาแห่งหนึ่ง เรียกรับเงินเร่งรัดการจดทะเบียนสิทธิและนิติกรรม ใกล้ขาดอายุความ',
     'เรียกรับเงินจากประชาชนเพื่อเร่งรัดขั้นตอนการจดทะเบียนสิทธิและนิติกรรมที่ดินให้เร็วกว่าคิวปกติ คดีใกล้ครบกำหนดอายุความ',
     'ม.62', 'ประชาชนผู้มาติดต่อขอจดทะเบียน (ผู้ร้อง)', 'นายวุฒิชัย เที่ยงธรรม', 'สำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตในภาครัฐ เขต 7',
     '2026-06-25', '2026-10-25', 'ปป 0021/9209 ลงวันที่ 25 มิถุนายน 2569', '644', true, false)
  RETURNING tcc_id
), a AS (
  INSERT INTO public.tbl_cmp_case_accused (tcc_id, tcca_no, tcca_name, tcca_position, tcca_idcard, tcca_agency)
  SELECT tcc_id, 1, 'นายสุเมธ จดทะเบียน', 'เจ้าพนักงานที่ดินสาขา', '3-1090-0xxxx-xx-x', 'สำนักงานที่ดินสาขาแห่งหนึ่ง' FROM c
)
INSERT INTO public.tbl_res_request (tcc_id, trr_status, trr_urgent, trr_signed_secgen, trr_sub_committee)
SELECT tcc_id, '005', true, false, NULL FROM c;
