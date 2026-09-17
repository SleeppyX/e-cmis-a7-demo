-- ==========================================================================
-- Add trr_status codes that ECMIS.STATUS_CODE gained after the last time
-- tbl_res_request_trr_status_check was updated (add_chairman_sign_statuses.sql
-- only went up to 021 / 119). Without this, any UPDATE that sets one of these
-- codes is rejected with:
--   new row for relation "tbl_res_request" violates check constraint
--   "tbl_res_request_trr_status_check"
--
-- Confirmed missing by direct test on 2026-09-17: PATCH trr_status='023' on a
-- real row (9215/2569) returned 23514 (check constraint violation) — this is
-- why the dir_case urgent-confirm feature (022/120, added earlier) and this
-- session's case_admin complexity gate (023/024/121/122) both silently fail
-- to persist through the live app even though the JS-side logic is correct.
--
-- main line
--   022 = PENDING_SECGEN_URGENT_CONFIRM   (dir_case restore — เลขาธิการฯ ยืนยันซ้ำหลัง กบค. รับรองด่วน)
--   023 = PENDING_CASE_ADMIN_SCREEN       (กบค. คัดกรองความยุ่งยากก่อนถึงประธานฯ)
--   024 = PENDING_CHAIRMAN_ASSIGN         (ประธานฯ ลงนามมอบหมาย — ทางลัดไม่ผ่านคณะอนุกลั่นกรอง)
-- 7.2 วินิจฉัยชี้มูล line
--   120 = PENDING_SECGEN_URGENT_CONFIRM_72 (dir_case restore, สาย 7.2)
--   121 = PENDING_CASE_ADMIN_SCREEN_72    (กบค. คัดกรองความยุ่งยากก่อนถึงประธานฯ, สาย 7.2)
--   122 = PENDING_CHAIRMAN_ASSIGN_72      (ประธานฯ ลงนามมอบหมาย, สาย 7.2)
--
-- Run as a DDL-privileged role (Supabase SQL editor / service_role).
-- The anon "publishable" key used by the demo cannot run ALTER.
-- ==========================================================================

ALTER TABLE public.tbl_res_request DROP CONSTRAINT tbl_res_request_trr_status_check;

ALTER TABLE public.tbl_res_request ADD CONSTRAINT tbl_res_request_trr_status_check
  CHECK (trr_status IS NULL OR trr_status = ANY (ARRAY[
    '000','001','002','003','004','005','006','007','008','009','010','011','012','013','014','015','016','017',
    '018','019','020','021','022','023','024',
    '100','101','102','103','104','105','106','107','108','109','110','111','112','113','114','115','116',
    '117','118','119','120','121','122'
  ]::bpchar[]));

COMMENT ON COLUMN public.tbl_res_request.trr_status IS
  'สถานะ CHAR(3) — mapping ตรงกับ ECMIS.STATUS_CODE / CODE_STATUS ใน assets/ecmis-app.js. '
  '000-024 = สายงานหลัก (009=PENDING_CHAIRMAN, 010=IN_SCREENING, 011=AGENDA_SET, '
  '018=PENDING_SIGN_ORDER_CHAIRMAN, 019=PENDING_SIGN_ORDER_SECGEN, 020=UNDER_INVESTIGATION, '
  '021=SCREENING_MORE_INFO, 022=PENDING_SECGEN_URGENT_CONFIRM, '
  '023=PENDING_CASE_ADMIN_SCREEN, 024=PENDING_CHAIRMAN_ASSIGN). '
  '100-122 = สายรายงานวินิจฉัยชี้มูล _72 (108=IN_SCREENING_72, 109=PENDING_INVITE_72, '
  '117=SCREENING_MORE_INFO_72, 118=PENDING_CHAIRMAN_72 [ประธานฯ ลงนามมอบหมายส่งคณะอนุกลั่นกรองฯ], '
  '119=PENDING_SIGN_AGENDA_72, 120=PENDING_SECGEN_URGENT_CONFIRM_72, '
  '121=PENDING_CASE_ADMIN_SCREEN_72, 122=PENDING_CHAIRMAN_ASSIGN_72).';
