# 📋 Task Plan: แก้บั๊ก dir_case เห็นเคสผิดใน inbox.html + เพิ่ม audit trail

> **Plan ID:** `2026-09-16-fix-dir-case-inbox-filter`
> **Date:** 2026-09-16
> **Author / Agent:** Claude Code (ผ่าน /grilling)
> **Status:** Done
> **Branch / PR:** `main`

---

## 🎯 1. Problem Statement & Business Objective
- **ปัญหา:** dir_case (ผอ.กบค.) login เข้า `inbox.html` แล้วเห็นเคสที่ไม่เกี่ยวข้อง/สถานะผิดปนมา แทนที่จะเห็นเฉพาะเคสที่เลขาธิการฯ ส่งมาจริงและดำเนินการได้
- **Root cause (ยืนยันจาก sub-agent investigation):** `ECMIS.canViewCase()` ใน `assets/ecmis-app.js` (บรรทัด ~150) บรรทัด dir_case เช็คจาก flag ค้าง `kase.urgent`/`kase.urgent72` (ตั้งครั้งเดียวไม่เคยเคลียร์) แทนที่จะเช็ค status/owner จริงเหมือนที่ `inboxFor()` ทำ (บรรทัด 260-262 ใช้ `ECMIS.STATUS[c.status].owner === 'dir_case'`) — ผลคือเคสเก่าที่ผ่านขั้น dir_case ไปนานแล้ว (เช่น `1396/2564` status `PENDING_INVITE_72` ที่คอมเมนต์เองว่า "กบค. รับรองแล้ว") ยังค้างโผล่ในลิสต์ dir_case ตลอดไป เพราะ `inbox.html` fallback branch (บรรทัด ~983-997) ใช้ `CASES.filter(c => ECMIS.canViewCase(c, role.id))` สำหรับ role ที่ไม่มี branch เฉพาะ (dir_case ไม่มี branch เฉพาะ)
- **ขอบเขตที่ตกลงกันใน /grilling (2026-09-16):**
  1. แก้ `canViewCase()` ให้ dir_case เช็ค status ตรง (`PENDING_URGENT`/`PENDING_URGENT_72`) แทน flag — ไม่แตะ seed data เก่า
  2. เพิ่มการเรียก `pushCaseHistory()` ที่จุด transition ของ urgent-gate flow ทั้งหมด (`SIGN_URGENT`/`SIGN_URGENT_72` ใน `approval-review.html`, `URGENT_CERTIFY`/`URGENT_CERTIFY_REJECT_72`/`URGENT_REJECT` ใน `approval-review.html`/`urgent-agenda.html`, `URGENT_CONFIRM`/`URGENT_CONFIRM_72`) เพื่อบันทึก audit trail ว่าใครส่ง/รับรอง/ตีกลับเมื่อไร — ไม่ต้องสร้าง UI ใหม่แสดงประวัตินี้ (เก็บไว้ใน `kase.history[]` ตามแพตเทิร์นเดิมพอ)

## 📂 2. Affected Routes & Modules
- [x] `assets/ecmis-app.js` — แก้ `canViewCase()` บรรทัด dir_case clause (line ~150)
- [x] `approval-review.html` + `res/` — เพิ่ม `pushCaseHistory()` ที่ SIGN_URGENT/SIGN_URGENT_72 (ใน `save_status` handler), URGENT_CERTIFY, URGENT_REJECT (ใน `initUrgentGateScreen`/`handleUrgentGate`), URGENT_CONFIRM (7.1, `handleUrgentGate` act `confirm`)
- [x] `urgent-agenda.html` + `res/` — เพิ่ม `pushCaseHistory()` ที่ isCertifyStep (URGENT_CERTIFY_72 / URGENT_CERTIFY_REJECT_72) และ isConfirmStep (URGENT_CONFIRM_72)
- [x] `inbox.html` — ตรวจสอบแล้วไม่มี action handler ของตัวเองสำหรับ URGENT_CONFIRM(_72) (มีแค่ KPI/filter ที่ลิงก์ไปหน้า approval-review.html/urgent-agenda.html ซึ่งจัดการ transition จริงแล้ว) จึงไม่ต้องแก้ไฟล์นี้

## 🛡️ 3. The 6 Golden Anti-Regression Pre-Check
- [x] 1. ไม่กระทบคอลัมน์ "ประเภทเรื่อง"
- [x] 2. ไม่เปิด agenda-registry.html ให้ chairman/affairs
- [x] 3. ใช้ ECMIS.getSupabaseClient() เท่านั้น
- [x] 4. รัน npm run sync หลังแก้ Root
- [x] 5. ไม่แตะ A4 geometry
- [x] 6. ไม่ bypass pre-commit hook

## 📝 4. Step-by-Step Implementation Tasks
- [x] Task 1: อ่านโค้ดปัจจุบันของ `canViewCase()`, `inboxFor()`, `pushCaseHistory()` ใน ecmis-app.js ให้เข้าใจ signature ก่อนแก้
- [x] Task 2: แก้ dir_case clause ใน `canViewCase()` ให้เช็ค `kase.status === 'PENDING_URGENT' || kase.status === 'PENDING_URGENT_72'` แทน `urgent`/`urgent72` flag
- [x] Task 3: เพิ่ม `pushCaseHistory()` call ที่ทุกจุด transition ของ urgent-gate flow (SIGN_URGENT, SIGN_URGENT_72, URGENT_CERTIFY, URGENT_CERTIFY_72, URGENT_CERTIFY_REJECT_72, URGENT_REJECT, URGENT_CONFIRM, URGENT_CONFIRM_72) — entry มี action/status ปลายทาง/เหตุผล (`urgentReason`) เมื่อมี text จริงจากผู้ใช้
- [x] Task 4: `npm run sync` + `npm test` (5-layer CI) — ผ่านทั้งหมด (Errors: 0, Warnings: 0)
- [x] Task 5: ทดสอบแบบ reading-level: ตรวจเคส seed `1396/2564` (status `PENDING_INVITE_72`, `urgent:true, urgent72:true`) — ก่อนแก้ `canViewCase()` คืนค่า true (leak เข้า dir_case list); หลังแก้คืนค่า false เพราะ status ไม่ตรง `PENDING_URGENT`/`PENDING_URGENT_72` อีกต่อไป ยืนยัน fix ตรงจุด
- [x] Task 6: commit (ไม่ push)

## 🧪 5. Verification & Quality Gate Matrix
- [x] Manual/reading-level walkthrough ตามที่ระบุใน Task 5 (ไม่ได้รัน local dev server เพราะไม่จำเป็นต่อการยืนยัน logic เชิง static)
- [x] Dual-Route Sync: npm run sync (synced approval-review.html, urgent-agenda.html)
- [x] Enterprise CI (5-Layer): npm test ผ่าน 100%

## 🏁 6. Completion & Sign-off
- **Completed Date:** 2026-09-16
- **Commit Reference:** see `fix(dir_case): filter inbox by real urgent status + add audit trail` commit
- **Notes:** ไม่แก้ seed data เก่าที่มี urgent flag ค้าง (ตามที่ตกลง) — flag ยังใช้เป็น badge แสดงประวัติได้ตามปกติ ไม่กระทบ list filter อีกต่อไปหลัง fix นี้ ไม่ต้องแก้ `inbox.html` เพราะไม่มี action handler ของ urgent-gate อยู่ในไฟล์นั้น (อยู่ใน approval-review.html/urgent-agenda.html ทั้งหมด)
