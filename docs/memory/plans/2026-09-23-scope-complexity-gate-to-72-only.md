# 📋 Task Plan: จำกัด complexity-gate ให้เหลือเฉพาะสาย 7.2 (ตัด 7.1 ออก)

> **Plan ID:** `2026-09-23-scope-complexity-gate-to-72-only`
> **Date:** 2026-09-23
> **Author / Agent:** Claude Code (ผ่าน /grill-me)
> **Status:** In Progress
> **Branch / PR:** `main`

---

## 🎯 1. Problem Statement & Business Objective
- **ข้อผิดพลาดที่ต้องแก้:** เมื่อ 2026-09-17 สร้าง gate "affairs คัดกรองความยุ่งยากก่อนถึงประธานฯ" ให้ครอบคลุมทั้งสาย 7.1 (ไต่สวนเบื้องต้น) และ 7.2 (วินิจฉัยชี้มูล) ตามที่ตกลงตอนนั้น — แต่ตอนนี้ผู้ใช้ยืนยันแล้ว (2026-09-23) ว่า**ต้องการเฉพาะสาย 7.2 (ชี้มูล) เท่านั้น** สาย 7.1 ไม่ควรผ่านขั้นนี้เลย ต้องเข้าคิวประธานฯ ตรงจากเลขาฯ เหมือนเดิมก่อนมีงานนี้
- **หลักฐาน:** ผู้ใช้พบเคส `9216/2569` (สาย 7.1) โผล่ในคิว "รอคัดกรองความยุ่งยาก" ของ affairs ทั้งที่ argument ตอนเริ่มงานนี้ระบุ "Flow ไต่สวนชี้มูล" (เจาะจง 7.2) มาตั้งแต่ต้น — สาย 7.1 เป็น scope ที่ขยายเพิ่มระหว่างการ grilling ไม่ใช่ความต้องการเดิม
- **ตรวจสอบแล้ว:** เคส 3 รายการที่ค้างอยู่ในสถานะ 7.1-only ของ gate นี้ปัจจุบัน (`9214/2569`, `9215/2569` ที่ `PENDING_CHAIRMAN_ASSIGN` รหัส 024, `9216/2569` ที่ `PENDING_CASE_ADMIN_SCREEN` รหัส 023) **เป็นข้อมูลทดสอบที่ค้างจากการทดสอบเมื่อ 2026-09-17 เท่านั้น ไม่มีเคสจริง/ผู้ใช้จริงติดอยู่** — ยืนยันด้วย query Supabase ตรง (`trr_status` = 023/024 มีแค่ 3 แถวนี้)

## 📐 ดีไซน์ที่ตกลงกัน
1. **สาย 7.1:** ตัด `SIGN_NORMAL` ออกจาก transition ที่นำไปสู่ gate — ให้กลับไปยิงตรงเข้า `PENDING_CHAIRMAN` เหมือนก่อนมีงานนี้ (undo การแก้ไขที่ทำไว้ 2026-09-17)
2. **สาย 7.2:** ยังคงเดิมทุกอย่าง — `SIGN_NORMAL_72` ยังคงยิงเข้า `PENDING_CASE_ADMIN_SCREEN_72` ตามปกติ ไม่แตะ
3. **สถานะที่กลายเป็น dead code สำหรับ 7.1:** `PENDING_CASE_ADMIN_SCREEN` (023) และ `PENDING_CHAIRMAN_ASSIGN` (024) — ไม่มี transition ใดๆ นำไปสู่สถานะเหล่านี้อีกต่อไปสำหรับสาย 7.1 ให้ **ลบออกจาก STATUS/STATUS_CODE/TRANSITIONS/PAGE_FOR/PAGE_PERMISSIONS ที่เกี่ยวกับ 7.1 โดยเฉพาะ** (ไม่ต้องลบรหัส 023/024 ออกจาก Supabase CHECK constraint — ปล่อยไว้เฉยๆ ไม่มีผลเสีย เพราะรหัสยังใช้อยู่แต่ไม่มี route ไปถึง)
4. **UI:** `inbox.html`'s affairs complexity-screening queue/modal (`openComplexityModal`, KPI, dropdown) ต้องแสดงเฉพาะเคส 7.2 เท่านั้น (ตรวจโค้ดปัจจุบันว่ากรองตาม `AFFAIRS_COMPLEXITY_STATUSES`/`isAffairsComplexityQueue` อยู่แล้วหรือไม่ ถ้ายังอ้างอิงสถานะ 7.1 ด้วยต้องตัดออก)
5. **`chairman-agenda.html`:** ฟังก์ชัน `isDirectAssignSignStep()` (หรือชื่อที่เกี่ยวข้อง) ต้องไม่รองรับสถานะ 7.1 (`PENDING_CHAIRMAN_ASSIGN`) อีกต่อไป — คงไว้แค่ 7.2 (`PENDING_CHAIRMAN_ASSIGN_72`)
6. **CLAUDE.md section 5:** แก้คำอธิบาย `affairs` ให้ระบุชัดว่า gate นี้ใช้เฉพาะสาย 7.2 เท่านั้น
7. **Data migration:** ย้ายเคสทดสอบ 3 รายการที่ค้างกลับสถานะที่ถูกต้อง:
   - `9216/2569` (023) → `PENDING_CHAIRMAN` (009)
   - `9214/2569`, `9215/2569` (024) → `PENDING_CHAIRMAN` (009) (เคสเคยผ่านทางลัดของ 7.1 ไปแล้วบางส่วน แต่เมื่อทางลัดนี้ถูกตัดออก ให้ถือว่ากลับไปอยู่ที่ขั้นประธานฯ พิจารณาปกติ — ไม่ต้องเก็บ `subOpinion`/`directAssign` ที่เขียนไว้ก่อนหน้า เคลียร์ทิ้งได้เพราะเป็นข้อมูลทดสอบ)

## 📂 2. Affected Routes & Modules
- [x] `assets/ecmis-app.js` — TRANSITIONS (`SIGN_NORMAL` ปลายทาง, ลบ `SCREEN_COMPLEX`/`SCREEN_ASSIGN`/`SIGN_ASSIGN` ที่เป็น 7.1-only ถ้าแยกจาก _72 ชัดเจน), STATUS/STATUS_CODE (ลบ entry `PENDING_CASE_ADMIN_SCREEN`/`PENDING_CHAIRMAN_ASSIGN` ที่ไม่มี _72), PAGE_FOR/pageForCaseByStatus, PAGE_PERMISSIONS, `AFFAIRS_COMPLEXITY_STATUSES`
- [x] `inbox.html` + `res/` — ตรวจ/แก้ให้คิวคัดกรองความยุ่งยากกรองเฉพาะ 7.2
- [x] `chairman-agenda.html` + `res/` — ตัด branch 7.1 ของ `isDirectAssignSignStep()` (หรือ equivalent)
- [x] `case-admin-inbox.html`/`case-admin-detail.html` — เช็คว่าไม่มีการอ้างอิงสถานะ 7.1 ของ gate นี้หลงเหลืออยู่ (ควรจะไม่มีอยู่แล้วตามงานก่อนหน้าที่ถอนออกไปแล้ว) — ยืนยันแล้ว ไม่มีการอ้างอิงหลงเหลือ
- [x] `CLAUDE.md` section 5 (`affairs`)
- [x] Supabase data: migrate เคส 9214, 9215, 9216 กลับ `PENDING_CHAIRMAN` (ทำผ่าน `scripts/lib/supabase-rest.js`, ไม่ต้องเขียนสคริปต์ใหม่ถาวร รันตรงๆ ก็พอเพราะเป็นการเคลียร์ข้อมูลทดสอบ)
- [x] **(พบเพิ่มระหว่าง live test)** `approval-review.html` + `res/` — พบ hardcoded targetStatus แยกต่างหากจาก TRANSITIONS ใน ecmis-app.js ที่ยังยิงเข้า `PENDING_CASE_ADMIN_SCREEN` (ไม่มี _72) สำหรับสาย 7.1 — แก้ให้ 7.1 ยิงตรงเข้า `PENDING_CHAIRMAN`, 7.2 ยังคงยิงเข้า `PENDING_CASE_ADMIN_SCREEN_72` เหมือนเดิม

## 🛡️ 3. The 6 Golden Anti-Regression Pre-Check
- [x] 1. ไม่กระทบคอลัมน์ "ประเภทเรื่อง"
- [x] 2. ไม่เปิด agenda-registry.html ให้ chairman/affairs
- [x] 3. ใช้ ECMIS.getSupabaseClient() เท่านั้น
- [x] 4. รัน npm run sync หลังแก้ Root
- [x] 5. ไม่แตะ A4 geometry
- [x] 6. ไม่ bypass pre-commit hook

## 📝 4. Step-by-Step Implementation Tasks
- [x] Task 1: อ่านโค้ดปัจจุบันทั้งหมดที่เกี่ยวข้องให้ครบก่อนแก้ (STATUS/TRANSITIONS/PAGE_FOR ของ 4 สถานะ, inbox.html complexity queue, chairman-agenda.html isDirectAssignSignStep)
- [x] Task 2: แก้ `SIGN_NORMAL` (7.1) ให้กลับไปยิงเข้า `PENDING_CHAIRMAN` ตรงๆ
- [x] Task 3: ลบ STATUS/STATUS_CODE/TRANSITIONS entries ที่เป็น 7.1-only ของ gate นี้ (`PENDING_CASE_ADMIN_SCREEN`, `PENDING_CHAIRMAN_ASSIGN`, `SCREEN_COMPLEX`, `SCREEN_ASSIGN`, `SIGN_ASSIGN` — เช็คให้แน่ใจว่าไม่ใช่ชื่อร่วมกับ _72 version ก่อนลบ)
- [x] Task 4: แก้ PAGE_FOR/pageForCaseByStatus/PAGE_PERMISSIONS ให้สอดคล้อง
- [x] Task 5: แก้ `inbox.html` ให้ complexity-screening queue กรองเฉพาะ 7.2
- [x] Task 6: แก้ `chairman-agenda.html` ตัด branch 7.1 ออก
- [x] Task 7: แก้ CLAUDE.md section 5
- [x] Task 8: Migrate ข้อมูลเคสทดสอบ 3 รายการกลับ `PENDING_CHAIRMAN` ผ่าน Supabase REST
- [x] Task 9: `npm run sync` + `npm test` (5-layer CI)
- [x] Task 10: ทดสอบจริงผ่าน browser — secgen เซ็นเคส 7.1 ใหม่ (ไม่ด่วน ไม่ซับซ้อน) ต้องเข้า `PENDING_CHAIRMAN` ตรงๆ ไม่ผ่าน affairs, secgen เซ็นเคส 7.2 ต้องยังผ่าน affairs เหมือนเดิม (regression check), affairs' inbox ไม่มีเคส 7.1 ปนอีก — ทดสอบจริงผ่าน browser แล้ว พบ+แก้ bug เพิ่ม (`approval-review.html` hardcoded status) ระหว่างทำ
- [x] Task 11: commit (ไม่ push)

## 🧪 5. Verification & Quality Gate Matrix
- [x] Manual live browser walkthrough ตาม Task 10 (ห้ามข้าม เพราะรอบก่อนข้าม live test แล้วพลาดจุดนี้ไป) — ทำแล้ว พบบั๊กเพิ่มเติมที่ approval-review.html ซึ่งการอ่านโค้ดอย่างเดียวจะไม่พบ (ตอกย้ำว่าทำไมข้อบังคับ live test ถึงสำคัญ)
- [x] Dual-Route Sync: npm run sync
- [x] Enterprise CI (5-Layer): npm test ผ่าน 100%

## 🏁 6. Completion & Sign-off
- **Completed Date:** 2026-09-23
- **Commit Reference:** (ระบุหลัง commit — ดู git log)
- **Notes:** งานนี้เป็นการ "ตัดสาย 7.1 ออก" จากฟีเจอร์ที่สร้างไปเมื่อ 2026-09-17 ไม่ใช่บั๊กใหม่ — สาเหตุคือตอน grilling ครั้งก่อนขยาย scope จาก "เฉพาะ 7.2" (ตามที่ผู้ใช้ตั้งใจตั้งแต่ต้น ดูจากชื่อ argument "Flow ไต่สวนชี้มูล") ไปเป็น "ทั้ง 7.1/7.2" เพราะพบว่า 7.1 ก็ขาด gate นี้เหมือนกัน แต่ผู้ใช้ไม่ได้ต้องการให้ 7.1 มี gate นี้จริงๆ

  **สรุปผลการทำงาน:**
  - แก้ `assets/ecmis-app.js`: `SIGN_NORMAL` กลับไปยิง `PENDING_CHAIRMAN` ตรงๆ, ลบ STATUS/STATUS_CODE/TRANSITIONS/STATUS_STEP/pageForCaseByStatus entries ของ `PENDING_CASE_ADMIN_SCREEN`/`PENDING_CHAIRMAN_ASSIGN` (ไม่มี _72), `AFFAIRS_COMPLEXITY_STATUSES` เหลือแค่ `PENDING_CASE_ADMIN_SCREEN_72`
  - แก้ `inbox.html`/`res/inbox.html`: ตัดการอ้างอิงสถานะ 7.1 ที่เหลือ (`isChairActionable`, `AFFAIRS_STATUSES`, `getAffairsActionBadge`, chairman catBadge, dropdown filter), `openComplexityModal()` เพิ่ม guard กัน 7.1 หลุดเข้ามา
  - แก้ `chairman-agenda.html`/`res/chairman-agenda.html`: `isDirectAssignSignStep()` เหลือแค่เช็ค `PENDING_CHAIRMAN_ASSIGN_72`
  - **พบเพิ่มระหว่าง live test:** `approval-review.html`/`res/approval-review.html` มี targetStatus logic hardcoded แยกต่างหากจาก TRANSITIONS ใน ecmis-app.js ที่ยังส่งสาย 7.1 เข้า `PENDING_CASE_ADMIN_SCREEN` อยู่ — แก้แยก branch เป็น `is72 ? PENDING_CASE_ADMIN_SCREEN_72 : PENDING_CHAIRMAN` แล้ว
  - `case-admin-inbox.html`/`case-admin-detail.html`: ยืนยันไม่มีการอ้างอิงสถานะ 7.1 ของ gate นี้หลงเหลือ (no-op ตามคาด)
  - `CLAUDE.md` section 5 (`affairs`): อัปเดตระบุชัดว่า gate นี้ใช้เฉพาะสาย 7.2 เท่านั้น
  - Supabase data migration: ยืนยันมีแค่ 3 แถวที่ trr_status 023/024 จริง (trr_id 795→023, 793→024, 794→024) ก่อน migrate ทั้งหมดไป `009` (PENDING_CHAIRMAN) สำเร็จ — ยืนยันซ้ำว่าไม่มีแถวเหลือที่ 023/024 หลัง migrate
  - Live browser regression test (ผ่าน Chrome extension + local static server, ใช้ `seedExistingCase`/`restoreExistingCase` ยืม-คืนเคสจริงที่ mock-registered แล้ว):
    - 7.1 เคส 9201/2569 (ไม่ด่วน ไม่ซับซ้อน): เซ็นแล้วระบบแจ้ง "ส่งต่อไปยัง ประธานกรรมการ ป.ป.ท." → Supabase ยืนยัน `trr_status='009'` — ไม่ผ่าน affairs เลย, ค้นหาใน affairs' inbox ไม่พบเคสนี้เลย ✅
    - 7.2 เคส 9220/2569 (ไม่ด่วน ไม่ซับซ้อน): เซ็นแล้วระบบแจ้ง "ส่งต่อไปยัง กลุ่มงานกิจการคณะกรรมการ (affairs)" → Supabase ยืนยัน `trr_status='121'` (PENDING_CASE_ADMIN_SCREEN_72) → ปรากฏในคิว "รอคัดกรองความยุ่งยาก" ของ affairs' inbox จริง ✅ (regression ผ่าน)
    - คืนค่าทั้ง 2 เคสทดสอบกลับ snapshot เดิมก่อนทดสอบเรียบร้อยแล้วผ่าน `restoreExistingCase`
  - `npm test` (5-layer CI) ผ่านทั้งหมดหลังแก้ไขครบ (รวมรอบหลังแก้ approval-review.html เพิ่ม)
