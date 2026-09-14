-- ==========================================================================
-- Consolidated fix for tbl_res_request_trr_status_check — the LIVE Supabase
-- constraint was found (2026-09-14, by direct probe against production) to
-- only allow codes 000-020 and 100-116. It does NOT include 021 or 117-119,
-- even though sql/add_chairman_sign_statuses.sql (already committed on this
-- branch, dated earlier) claims to add them — that migration was apparently
-- never actually run against this Supabase project. This file supersedes it:
-- apply THIS one file instead of add_chairman_sign_statuses.sql, since it
-- includes everything that one did (021, 117, 118, 119) plus 2 further codes
-- gained today from a workflow-spec gap-fix pass (กจ7-workflow.txt, confirmed
-- by client):
--   120 = PENDING_SUPPORT_ASSIGN_72   (รอ ผอ.กบค. ยืนยันส่งเข้าคณะอนุสนับสนุนฯ — 7.2)
--   121 = PENDING_AFFAIRS_OPINION_72  (รอกลุ่มงานกิจการคณะกรรมการลงความเห็นก่อนบรรจุวาระ — 7.2,
--                                      เส้นทางปกติที่ไม่ผ่านอนุกลั่นกรองฯ)
--
-- Confirmed via direct PATCH probe against live tbl_res_request (2026-09-14):
--   000-020: OK   021: BLOCKED   100-116: OK   117-121: BLOCKED
--
-- Without this, any UPDATE that sets one of the BLOCKED codes above is
-- rejected with:
--   new row for relation "tbl_res_request" violates check constraint
--   "tbl_res_request_trr_status_check"
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
    '117','118','119','120','121'
  ]::bpchar[]));

COMMENT ON COLUMN public.tbl_res_request.trr_status IS
  'สถานะ CHAR(3) — mapping ตรงกับ ECMIS.STATUS_CODE / CODE_STATUS ใน assets/ecmis-app.js. '
  '000-021 = สายงานหลัก (020=UNDER_INVESTIGATION, 021=SCREENING_MORE_INFO). '
  '100-121 = สายรายงานวินิจฉัยชี้มูล _72 (117=SCREENING_MORE_INFO_72, '
  '118=PENDING_CHAIRMAN_72, 119=PENDING_SIGN_AGENDA_72, '
  '120=PENDING_SUPPORT_ASSIGN_72 [รอ ผอ.กบค. ยืนยันส่งเข้าคณะอนุสนับสนุนฯ], '
  '121=PENDING_AFFAIRS_OPINION_72 [รอกลุ่มงานกิจการคณะกรรมการลงความเห็นก่อนบรรจุวาระ]).';
