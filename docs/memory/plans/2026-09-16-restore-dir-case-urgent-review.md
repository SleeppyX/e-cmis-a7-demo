# Plan: คืน role ผอ.กบค. (dir_case) กลับเข้าระบบ — เฉพาะด่านรับรองความเร่งด่วน (T7)

**วันที่:** 2026-09-16
**ผู้ร้องขอ:** ผู้ใช้ (ผ่าน /grilling)

## วัตถุประสงค์
- Commit `ddd7210` ลบ role `dir_case` (ผอ.กบค.) ออกจากระบบทั้งหมด พร้อมตัดขั้นตอน "รับรองใบด่วน"
  (URGENT_CERTIFY/URGENT_CERTIFY_72) ออกจาก flow ทั้ง 7.1/7.2 — เลขาธิการฯ เซ็นเคสด่วนแล้วเข้า
  PENDING_CHAIRMAN(_URGENT_72) ตรงทันที
- ตอนนี้ยืนยัน requirement ใหม่: ต้องมี role `dir_case` จริงในระบบอีกครั้ง แต่**แคบกว่าที่เคยมี** —
  เฉพาะ "ด่านรับรองความเร่งด่วน" (T7) เท่านั้น **ไม่มี**คิว assign อนุสนับสนุนฯ แบบที่เคยออกแบบไว้ใน
  branch `pre-main` (commit `e682c7b` เป็นต้นไป) ซึ่งเป็นแนวทางที่ถูกพับไว้ ไม่ได้ merge เข้า `main`
- เพิ่ม 2 พฤติกรรมใหม่ที่ไม่เคยมีมาก่อน (ยืนยันกับผู้ใช้ผ่าน /grilling แล้ว):
  1. เพิ่มปุ่ม **"ไม่เห็นด้วยว่าด่วน"** ให้ dir_case ใช้ตีกลับที่ขั้นรับรอง ทั้งสาย 7.1 และ 7.2
     (ของเดิมสาย 7.2 ไม่เคยมีปุ่มปฏิเสธเลย)
  2. หลัง dir_case รับรองแล้ว **ไม่ส่งตรงเข้าคิวประธานฯ** แต่ต้องกลับไปให้ **เลขาธิการฯ ยืนยันซ้ำ**
     อีกครั้งก่อน (สถานะคั่นกลางใหม่ `PENDING_SECGEN_URGENT_CONFIRM(_72)`)

## 6 Golden Rules Pre-check
1. ตาราง "ประเภทเรื่อง" (6 คอลัมน์) — ไม่แตะ ✅
2. agenda-registry.html ไม่เปิดให้ chairman/affairs — ไม่แตะ ✅
3. Supabase Singleton — ใช้ `ECMIS.getSupabaseClient()` เดิมทุกจุด ไม่เรียก `createClient()`ตรง ✅
4. Root/`/res/` sync — รัน `npm run sync` ทุกครั้งหลังแก้ Root HTML ✅
5. A4 geometry — ไม่แตะ ✅
6. ไม่ bypass pre-commit hook (`--no-verify`) ✅

## สถานะ/Transition ใหม่ที่เพิ่มใน `assets/ecmis-app.js`
- `PENDING_URGENT` (code `007`, restore เดิม, owner `dir_case`) และ `PENDING_URGENT_72`
  (code `106`, restore เดิม, owner `dir_case`)
- `PENDING_SECGEN_URGENT_CONFIRM` (code `022`, ใหม่, owner `secgen`) และ
  `PENDING_SECGEN_URGENT_CONFIRM_72` (code `120`, ใหม่, owner `secgen`)
- Transition ใหม่/restore:
  - `SIGN_URGENT` / `SIGN_URGENT_72` (secgen): กลับไปยิงเข้า `PENDING_URGENT(_72)` เหมือนเดิม
    (ก่อนหน้านี้ถูกแก้ให้ยิงตรง `PENDING_CHAIRMAN(_URGENT_72)`)
  - `URGENT_CERTIFY` / `URGENT_CERTIFY_72` (dir_case, เห็นด้วยว่าด่วน): `PENDING_URGENT(_72)` →
    `PENDING_SECGEN_URGENT_CONFIRM(_72)` (**เปลี่ยนปลายทาง** จากเดิมที่เคยไป `PENDING_CHAIRMAN(_URGENT_72)` ตรง ๆ)
  - `URGENT_REJECT` (7.1, dir_case, ไม่เห็นด้วยว่าด่วน — ของเดิมมีอยู่แล้ว): `PENDING_URGENT` →
    `IN_SCREENING`
  - `URGENT_CERTIFY_REJECT_72` (7.2, dir_case, ไม่เห็นด้วยว่าด่วน — **ใหม่**, ตั้งชื่อแยกจาก
    `URGENT_REJECT_72` เดิมที่เป็นของ chairman คนละขั้นตอน): `PENDING_URGENT_72` → `PENDING_SECGEN_72`
  - `URGENT_CONFIRM` / `URGENT_CONFIRM_72` (secgen, ยืนยันซ้ำ — **ใหม่**):
    `PENDING_SECGEN_URGENT_CONFIRM(_72)` → `PENDING_CHAIRMAN(_URGENT_72)`
  - `ORDER_AGENDA_URGENT` (7.1, chairman): restore guard `k => !!k.urgentCertified`

## ไฟล์ที่แก้ (Root + `/res/` sync แล้ว)
- `assets/ecmis-app.js` — ROLES (เพิ่ม `dir_case`), STATUS/STATUS_CODE/TRANSITIONS (ตามด้านบน),
  STATUS_STEP/STATUS_STEP_72/PAGE_FOR_72/pageForCaseByStatus/ACT7_STAGE_72 (routing ของสถานะใหม่),
  `canViewCase()` (ให้ dir_case เห็นเฉพาะเคสด่วนที่เกี่ยวข้อง), `PAGE_PERMISSIONS`
  (`approval-review.html`, `urgent-agenda.html`, `inbox.html` เพิ่ม `dir_case`),
  `LOGIN_ALLOWED_ROLE_IDS` (เพิ่ม `dir_case`)
- `approval-review.html` — restore chip "T7 ผอ.กบค." / ข้อความ G3 outcome, restore
  `sequentialSignDialog` ตอนเลขาธิการฯ เซ็นเคสด่วนไม่ซับซ้อน, save_status ยิงเข้า
  `PENDING_URGENT(_72)` อีกครั้งเมื่อเป็นเคสด่วน, เพิ่มฟังก์ชัน `initUrgentGateScreen()` ใหม่
  (จอแยกต่างหากสำหรับ dir_case รับรอง/ปฏิเสธ และ secgen ยืนยันซ้ำ ของสาย 7.1)
- `urgent-agenda.html` — restore `isCertifyStep` (dir_case), เพิ่ม `isConfirmStep` (secgen ยืนยันซ้ำ)
  ใหม่, เพิ่มปุ่ม/handler `certify` / `certifyReject` (ใหม่) / `confirm` (ใหม่) ของสาย 7.2
- `inbox.html` — เพิ่ม KPI/คิวงานของ dir_case (การ์ด "รอรับรองเหตุผลเร่งด่วน"), เพิ่มการ์ด
  "รอยืนยันวาระด่วน" ให้ secgen เห็น `PENDING_SECGEN_URGENT_CONFIRM(_72)`, badge/route ของทั้งสอง role
- `login.html` — เพิ่มปุ่ม quick-login `dir_case` (Bunlue.S)
- `CLAUDE.md` — เพิ่ม bullet `dir_case` ใน section 5 (ขอบเขตแคบกว่าที่เคยมี — ด่านรับรองความเร่งด่วนอย่างเดียว)

## ไม่แตะ (ตามข้อกำหนด)
- ชื่อ/ตำแหน่ง `case_admin` ("กบค.กลุ่มงานบริหารคดีและบริหารทั่วไป")
- ข้อความในแม่แบบเอกสารพิมพ์ `assets/order-memo-docs.js`
- คอลัมน์ "ประเภทเรื่อง" ทุกตาราง
- สิทธิ์ `agenda-registry.html`
- ค่าคงที่ A4 geometry
- การเรียก Supabase client (ยังผ่าน `ECMIS.getSupabaseClient()` ทุกจุด)

## Verification
- `npm run sync` — sync แล้ว (approval-review.html, inbox.html, urgent-agenda.html, login.html)
- `npm test` — CI 5/5 ผ่านทั้งหมด (Syntax, Dual-Route, Zero-404 Links, Anti-Regression, A4 Layout)
- ตรวจ manual logic: transition graph ใหม่ครบ 3 สถานะ (certify/reject/confirm) ทั้งสาย 7.1/7.2

## Checklist
- [x] อ่าน `git show ddd7210` (reverse-diff อ้างอิง) + โค้ดปัจจุบันของทุกไฟล์ที่เกี่ยวข้อง
- [x] เพิ่ม role `dir_case` กลับเข้า `ROLES` (login `Bunlue.S`)
- [x] เพิ่มสถานะ/transition ใหม่ตามผังด้านบน (รวม 2 พฤติกรรมใหม่)
- [x] แก้ `approval-review.html` (สาย 7.1) — จอ certify/confirm ใหม่
- [x] แก้ `urgent-agenda.html` (สาย 7.2) — certify/reject/confirm
- [x] แก้ `inbox.html` — คิวงาน/KPI ของ dir_case และการ์อยืนยันซ้ำของ secgen
- [x] แก้ `login.html` — ปุ่ม quick-login
- [x] `npm run sync` + `npm test` ผ่าน 5/5
- [x] อัปเดต `CLAUDE.md` section 5
- [x] Commit งาน (ไม่ push)

## 6. Completion & Sign-off
**วันที่เสร็จ:** 2026-09-16
**สรุป:** คืน role `dir_case` (ผอ.กบค.) กลับเข้าระบบสำเร็จ ในขอบเขตที่แคบกว่าเดิม — เฉพาะด่านรับรอง
ความเร่งด่วน (T7) ก่อนเสนอประธานฯ ไม่มีคิว assign อนุสนับสนุนฯ เหมือนที่เคยออกแบบไว้ใน branch
`pre-main` เพิ่มพฤติกรรมใหม่ 2 อย่างตามที่ผู้ใช้ยืนยัน: (1) ปุ่ม "ไม่เห็นด้วยว่าด่วน" ใช้ได้ทั้งสาย
7.1/7.2 และ (2) เลขาธิการฯ ต้องยืนยันซ้ำอีกครั้งหลัง ผอ.กบค. รับรองแล้ว ก่อนเข้าคิวประธานฯ จริง
(สถานะคั่นกลางใหม่ `PENDING_SECGEN_URGENT_CONFIRM(_72)`) CI 5/5 ผ่านทั้งหมด, sync Root↔/res/ ครบ
100%, ไม่แตะ case_admin/order-memo-docs/ประเภทเรื่อง/agenda-registry/A4 geometry ตามข้อกำหนด
