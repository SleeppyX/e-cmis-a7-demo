-- ==========================================================================
-- Add trr_status code '120' (PENDING_SUPPORT_ASSIGN_72) that ECMIS.STATUS_CODE
-- gained when the ผอ.กบค. (dir_case) role and its 2 new pages
-- (dir-case-support-assign.html / dir-case-urgent-review.html) were reintroduced.
--
-- Without this, any UPDATE that sets trr_status='120' is rejected with:
--   new row for relation "tbl_res_request" violates check constraint
--   "tbl_res_request_trr_status_check"
--
-- The other 3 new/reinstated statuses reuse codes already whitelisted by
-- add_chairman_sign_statuses.sql and do NOT need this migration:
--   007 = PENDING_URGENT            (reinstated — was already whitelisted)
--   008 = PENDING_SUPPORT_ASSIGN    (was already whitelisted, previously unused)
--   106 = PENDING_URGENT_72         (reinstated — was already whitelisted)
-- Only the 7.2 twin of 008 has no free whitelisted slot, hence this migration:
--   120 = PENDING_SUPPORT_ASSIGN_72 (รอ ผอ.กบค. ยืนยันส่งเข้าคณะอนุสนับสนุนฯ — วินิจฉัยชี้มูล)
--
-- Run as a DDL-privileged role (Supabase SQL editor / service_role).
-- The anon "publishable" key used by the demo cannot run ALTER.
-- ==========================================================================

ALTER TABLE public.tbl_res_request DROP CONSTRAINT tbl_res_request_trr_status_check;

ALTER TABLE public.tbl_res_request ADD CONSTRAINT tbl_res_request_trr_status_check
  CHECK (trr_status IS NULL OR trr_status = ANY (ARRAY[
    '000','001','002','003','004','005','006','007','008','009','010','011','012','013','014','015','016','017',
    '018','019','020','021',
    '100','101','102','103','104','105','106','107','108','109','110','111','112','113','114','115','116',
    '117','118','119','120'
  ]::bpchar[]));

COMMENT ON COLUMN public.tbl_res_request.trr_status IS
  'สถานะ CHAR(3) — mapping ตรงกับ ECMIS.STATUS_CODE / CODE_STATUS ใน assets/ecmis-app.js. '
  '000-021 = สายงานหลัก (007=PENDING_URGENT [รอ ผอ.กบค. รับรองใบด่วน], '
  '008=PENDING_SUPPORT_ASSIGN [รอ ผอ.กบค. ยืนยันส่งเข้าคณะอนุสนับสนุนฯ], '
  '009=PENDING_CHAIRMAN, 010=IN_SCREENING, 011=AGENDA_SET, '
  '018=PENDING_SIGN_ORDER_CHAIRMAN, 019=PENDING_SIGN_ORDER_SECGEN, 020=UNDER_INVESTIGATION, '
  '021=SCREENING_MORE_INFO). '
  '100-120 = สายรายงานวินิจฉัยชี้มูล _72 (106=PENDING_URGENT_72, 108=IN_SCREENING_72, '
  '109=PENDING_INVITE_72, 117=SCREENING_MORE_INFO_72, 118=PENDING_CHAIRMAN_72, '
  '119=PENDING_SIGN_AGENDA_72, 120=PENDING_SUPPORT_ASSIGN_72).';
