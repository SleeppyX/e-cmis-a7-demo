# 📋 Task Plan: แก้ stepper ผิดสาย (7.1 แทน 7.2) ใน initReport213Screen()

> **Plan ID:** `2026-09-16-fix-72-stepper-in-report213`
> **Date:** 2026-09-16
> **Author / Agent:** Claude Code (ผ่าน /grilling)
> **Status:** Done
> **Branch / PR:** `main`

---

## 🎯 1. Problem Statement & Business Objective
- **ปัญหา:** หน้า `approval-review.html` (เลขาธิการฯ พิจารณา/ลงนาม) เคส 7.2 (วินิจฉัยชี้มูล) ที่ยังอยู่ช่วงก่อนบอร์ดลงมติ (docType ยังเป็น `'644'` ไม่ใช่ `'RULING'`) แสดง stepper ผิดเป็นแบบ 7.1 (7 ขั้น มี "ออกคำสั่ง ม.24") แทนที่จะเป็น 5 ขั้นของสาย 7.2 (`เลขาธิการฯ ลงนาม → กลั่นกรอง/บรรจุวาระ → ประชุม/บันทึกมติ → จัดทำ/ลงนามรายงานวินิจฉัยชี้มูล → แจ้งผล`)
- **Root cause (ยืนยันจาก sub-agent investigation):** `initReport213Screen()` ใน `approval-review.html` (บรรทัด ~594-597) เช็คเฉพาะ `isCase73(kase)` เพื่อเลือก `FLOW_STEPS_73` แต่ไม่เคยเช็ค `ECMIS.isCase72(kase)` เลย จึง fallback ไปเรียก `ECMIS.stepperHtml(kase.status)` แบบไม่ส่ง stepsArr ซึ่ง default เป็น `FLOW_STEPS` (สาย 7.1) เสมอ — ต่างจาก `initRulingScreen()` (ใช้ตอน docType เป็น RULING) ที่เช็คถูกและส่ง `FLOW_STEPS_72`/`STATUS_STEP_72` อย่างชัดเจน (บรรทัด ~1466)
- **สิ่งที่ไม่ใช่บั๊ก:** ชื่อเอกสาร "รายงานการไต่สวนข้อเท็จจริง (แบบ ปปท. ๖-๔๔)" ที่เคส 7.2 ช่วงนี้แสดง ถูกต้องตามคอมเมนต์ในโค้ด (บรรทัด 567-570) — ไม่ต้องแก้
- **ขอบเขต:** วันนี้กระทบ `9203/2569`, `9204/2569` (สถานะ `PENDING_SECGEN_72` + `docType:'644'`) แต่ fix ต้องแก้ที่ logic ทั่วไป ไม่ใช่แก้ data รายเคส เพื่อป้องกันเคส 7.2 ใหม่ในอนาคตที่เข้าสถานะเดียวกัน (ตามที่ตกลงใน /grilling)

## 📂 2. Affected Routes & Modules
- [x] `approval-review.html` + `res/approval-review.html` — แก้ `initReport213Screen()` ให้เช็ค `ECMIS.isCase72(kase)` ก่อน fallback

## 🛡️ 3. The 6 Golden Anti-Regression Pre-Check
- [x] 1. ไม่กระทบคอลัมน์ "ประเภทเรื่อง"
- [x] 2. ไม่เปิด agenda-registry.html ให้ chairman/affairs
- [x] 3. ใช้ ECMIS.getSupabaseClient() เท่านั้น
- [x] 4. รัน npm run sync หลังแก้ Root
- [x] 5. ไม่แตะ A4 geometry
- [x] 6. ไม่ bypass pre-commit hook

## 📝 4. Step-by-Step Implementation Tasks
- [x] Task 1: อ่านโค้ด `initReport213Screen()`, `isCase72()`, `isCase73()`, `FLOW_STEPS_72`, `STATUS_STEP_72`, `stepperHtml()` ให้เข้าใจ signature/ลำดับความสำคัญของ branch (73 ควรเช็คก่อน 72 หรือหลัง — 73 กับ 72 ไม่ทับซ้อนกันอยู่แล้วตาม procType จึงสลับลำดับได้ แต่ให้คงลำดับเดิม 73 ก่อน แล้วเพิ่ม 72 เป็นเงื่อนไขถัดไปก่อน fallback เป็น 7.1)
- [x] Task 2: แก้ `initReport213Screen()` ให้เรียก `ECMIS.stepperHtml(kase.status, ECMIS.FLOW_STEPS_72, ECMIS.STATUS_STEP_72)` เมื่อ `ECMIS.isCase72(kase)` เป็น true (และไม่ใช่ 73)
- [x] Task 3: ตรวจว่ามีจุดอื่นใน `initReport213Screen()`/ฟังก์ชันที่เรียกจากมันที่ต้องพึ่ง flow step label สาย 7.2 เพิ่มเติมหรือไม่ (เช่น label อื่นที่ hardcode เป็น 7.1) — ไม่พบจุดอื่น มีแค่ตัว stepper element เดียวในฟังก์ชันนี้
- [x] Task 4: `npm run sync` + `npm test` (5-layer CI)
- [x] Task 5: ทดสอบ manual (อ่าน/รัน local): เปิด `approval-review.html?case=9203/2569` และ `9204/2569` ควรเห็น stepper 5 ขั้นแบบ 7.2 แล้ว, เปิด `1154/2566` (RULING) ควรยังเหมือนเดิม, เปิดเคส 7.1 ตัวอย่าง (เช่น 9205/2569 หรือ 9208/2569) ควรยังเป็น stepper 7.1 เหมือนเดิม (ไม่ regress) — ยืนยันด้วยการอ่าน logic: `isRuling` (docType.code==='RULING') กำหนดตั้งแต่ต้นว่าจะไปที่ `initRulingScreen()` แทน จึงไม่มีทางที่เคส RULING จะมาถึงโค้ดที่แก้; เคส 7.1 (isCase73=false, isCase72=false) ยังตกไปที่ branch `else` เดิม (bare `stepperHtml(kase.status)`)
- [x] Task 6: commit (ไม่ push)

## 🧪 5. Verification & Quality Gate Matrix
- [x] Manual/reading-level walkthrough ตาม Task 5
- [x] Dual-Route Sync: npm run sync
- [x] Enterprise CI (5-Layer): npm test ผ่าน 100%

## 🏁 6. Completion & Sign-off
- **Completed Date:** 2026-09-16
- **Commit Reference:** (see git log — commit created right after this file was finalized)
- **Notes:** ไม่แก้ data ของ 9203/2569, 9204/2569 — docType '644' ของทั้งสองเคสถูกต้องตามดีไซน์เดิมอยู่แล้ว แก้เฉพาะ logic เลือก stepper ใน `initReport213Screen()` (`approval-review.html`, ~line 457-462): เพิ่มตัวแปร `is72 = !is73 && ECMIS.isCase72(kase)` แล้วเลือก `ECMIS.stepperHtml(kase.status, ECMIS.FLOW_STEPS_72, ECMIS.STATUS_STEP_72)` เมื่อ `is72` เป็น true ก่อน fallback ไป `ECMIS.stepperHtml(kase.status)` (FLOW_STEPS 7.1 default) เดิม ลำดับความสำคัญยังคง 73 → 72 → 7.1 fallback ตามแผน `npm run sync` + `npm test` ผ่านครบ 5 ด่าน (0 errors, 0 warnings)
