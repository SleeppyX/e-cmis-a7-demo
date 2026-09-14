# Plan: เพิ่ม role ผอ.กบค. (dir_case) กลับเข้าระบบ + 2 หน้าใหม่

**วันที่:** 2026-09-14
**ผู้ร้องขอ:** ผู้ใช้ (ผ่าน /grill-me)
**บริบท:** ก่อนหน้านี้ในวันเดียวกัน role `dir_case` ถูกลบออกทั้งระบบ (commit `ddd7210`) เพราะเข้าใจว่าไม่มี role นี้จริง
แต่ได้รับ requirement เพิ่มเติมว่าต้องมี role นี้จริง พร้อม 2 หน้าใหม่ จึงต้องนำกลับมา

## วัตถุประสงค์
- เพิ่ม role `dir_case` (ผอ.กบค. — ผู้อำนวยการกองบริหารคดี) กลับเข้า ROLES array จริง อยู่เหนือ `case_admin`
- หน้าใหม่ 1: `dir-case-support-assign.html` — ผอ.กบค. ยืนยัน/ตีกลับ ก่อนส่งเคสซับซ้อนเข้าคณะอนุกรรมการสนับสนุนเลขาธิการฯ
  (สถานะใหม่ `PENDING_SUPPORT_ASSIGN`/`_72` คั่นระหว่างเลขาธิการฯ ชี้ซับซ้อน กับการเข้า `IN_SUPPORT_SUB`(`_72`) จริง)
- หน้าใหม่ 2: `dir-case-urgent-review.html` — ผอ.กบค. รับรอง/ไม่รับรองใบด่วน (นำ `PENDING_URGENT`/`URGENT_CERTIFY` ที่เพิ่งตัดออกกลับมาทั้งหมด)
- ครอบคลุมทั้ง 7.1 และ 7.2

## 6 Golden Rules Pre-check
1. ตาราง "ประเภทเรื่อง" — ไม่แตะ ✅
2. agenda-registry.html ไม่เปิดให้ chairman/affairs — ไม่แตะ ✅
3. Supabase Singleton — ใช้ `ECMIS.getSupabaseClient` เหมือนหน้าอื่น ✅
4. Root/`/res/` sync — `npm run sync` แล้ว ✅
5. A4 geometry — ไม่แตะ ✅
6. ไม่ bypass pre-commit hook ✅

## ไฟล์ที่ได้รับผลกระทบ (Root + /res/)
- `assets/ecmis-app.js` — เพิ่ม ROLES.dir_case, STATUS/STATUS_CODE/TRANSITIONS ใหม่ (`PENDING_URGENT`, `PENDING_URGENT_72`, `PENDING_SUPPORT_ASSIGN`, `PENDING_SUPPORT_ASSIGN_72`), คืนค่า guard `urgentCertified`, แก้ PAGE_PERMISSIONS/PAGE_FOR_72/pageForCaseByStatus/STATUS_STEP(_72)/ACT7_STAGE_72
- `dir-case-support-assign.html` (ใหม่), `dir-case-urgent-review.html` (ใหม่)
- `approval-review.html`, `review.html` — คืน sequentialSignDialog + assign/save_status routing ผ่าน dir_case
- `chairman-agenda.html` — `isAssignStep()` กลับไปเช็ค `urgentCertified`
- `screening.html`, `subcommittee-screening.html` — สิทธิ์ manualTeam กลับเป็น `dir_case`
- `board-resolution.html`, `resolution.html`, `resolution-72.html` — signer/presenter กลับไปอ้าง `dir_case`
- `inbox.html` — เพิ่ม `DIR_CASE_PAGE_FOR_STATUS` routing (คล้าย `AFFAIRS_PAGE_FOR_STATUS`)
- เอกสารพิมพ์ (`order.html`, `order-m24.html`, `meeting-docs.html`, `meeting-report.html`, `agenda-meeting-docs.html`, `assets/order-memo-docs.js`, `assets/dashboard-export-service.js`, `case-admin-inbox.html`, `case-admin-detail.html`) — คืนข้อความ "ผอ.กบค./ผู้อำนวยการกองบริหารคดี"
- `sql/add_dir_case_support_assign_72_status.sql` (ใหม่) — migration เพิ่ม code `120`

## Known blocker
สถานะใหม่ 4 ตัวใช้ code: `007`(PENDING_URGENT), `008`(PENDING_SUPPORT_ASSIGN), `106`(PENDING_URGENT_72) — ทั้ง 3 นี้ **whitelisted อยู่แล้ว** ใน CHECK constraint (จาก `add_chairman_sign_statuses.sql`) ไม่ต้อง migrate เพิ่ม
มีเพียง `120`(PENDING_SUPPORT_ASSIGN_72) ที่ต้องรัน `sql/add_dir_case_support_assign_72_status.sql` โดยผู้มีสิทธิ์ DDL ก่อนจึงจะ persist ได้จริงใน Supabase

## Verification
- `npm run sync` + `npm test` (CI 5/5) ผ่าน
- Manual Chrome สวมบทบาท secgen → dir_case ครบทั้ง 2 flow (urgent-review, support-assign) เดินจริงจน DB เปลี่ยนสถานะถูกต้อง (007→009, 008→006)
- ไม่มี console error
