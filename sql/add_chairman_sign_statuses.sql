-- ==========================================================================
-- Add trr_status codes that ECMIS.STATUS_CODE gained after the last time
-- tbl_res_request_trr_status_check was updated (add_order_signing_statuses.sql
-- only went up to 019 / 116). Without this, any UPDATE that sets one of these
-- codes is rejected with:
--   new row for relation "tbl_res_request" violates check constraint
--   "tbl_res_request_trr_status_check"
--
-- main line
--   020 = UNDER_INVESTIGATION      (order.html save_order — was written as raw string before)
--   021 = SCREENING_MORE_INFO      (subcommittee "ขอข้อมูลเพิ่มเติม")
-- 7.2 วินิจฉัยชี้มูล line
--   117 = SCREENING_MORE_INFO_72   (subcommittee "ขอข้อมูลเพิ่มเติม")
--   118 = PENDING_CHAIRMAN_72      (plan 2026-09-08-chairman-assign-before-screening —
--                                   ประธานฯ ลงนามมอบหมายส่งคณะอนุกลั่นกรองฯ, เคสไม่ด่วน)
--   119 = PENDING_SIGN_AGENDA_72   (plan 2026-09-09-chairman-sign-agenda-72 —
--                                   ประธานฯ ลงนามสั่งบรรจุวาระ หลังคณะอนุกลั่นกรองฯ พิจารณาเสร็จ)
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
    '117','118','119'
  ]::bpchar[]));

COMMENT ON COLUMN public.tbl_res_request.trr_status IS
  'สถานะ CHAR(3) — mapping ตรงกับ ECMIS.STATUS_CODE / CODE_STATUS ใน assets/ecmis-app.js. '
  '000-021 = สายงานหลัก (009=PENDING_CHAIRMAN, 010=IN_SCREENING, 011=AGENDA_SET, '
  '018=PENDING_SIGN_ORDER_CHAIRMAN, 019=PENDING_SIGN_ORDER_SECGEN, 020=UNDER_INVESTIGATION, '
  '021=SCREENING_MORE_INFO). '
  '100-119 = สายรายงานวินิจฉัยชี้มูล _72 (108=IN_SCREENING_72, 109=PENDING_INVITE_72, '
  '117=SCREENING_MORE_INFO_72, 118=PENDING_CHAIRMAN_72 [ประธานฯ ลงนามมอบหมาย], '
  '119=PENDING_SIGN_AGENDA_72 [ประธานฯ ลงนามสั่งบรรจุวาระ]).';
