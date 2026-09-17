# 📋 Task Plan: เพิ่ม gate คัดกรองความยุ่งยากโดย case_admin (กจ.) ก่อนถึงประธานฯ

> **Plan ID:** `2026-09-17-case-admin-complexity-gate`
> **Date:** 2026-09-17
> **Author / Agent:** Claude Code (ผ่าน /grilling)
> **Status:** Done
> **Branch / PR:** `main`

---

## 🎯 1. Problem Statement & Business Objective
- **ความต้องการ:** ตามผัง flow ที่ผู้ใช้ให้มา หลังเลขาธิการฯ ลงนามเคสที่ไม่เร่งด่วนแล้ว ก่อนถึงประธานฯ ต้องมีขั้นตอน **กองบริหารคดี (กลุ่มงานกิจการคณะกรรมการ)** ลงรับและ**คัดกรองว่าสำนวนมีความยุ่งยากหรือไม่**:
  - **ยุ่งยาก** → กองบริหารคดี (กลุ่มงานบริหารคดีและบริหารทั่วไป) ส่งเข้าคณะอนุกลั่นกรองฯ (คณะ 1-8) เหมือนเดิม — **ข้ามขั้นตอนประธานฯ ไปเลย** ประธานฯ จะไม่เห็นเคสจนกว่าจะกลับมาหลังบอร์ดลงมติ
  - **ไม่ยุ่งยาก** → กองบริหารคดี (กจ.) ทำความเห็นเสนอ → ประธานฯ ลงนามมอบหมาย (ทางลัด ไม่ผ่านคณะอนุกลั่นกรอง)
  - **ทั้งสองเส้นทางบรรจบกันที่จุดเดียวกัน**: ประธานฯ ลงนามบรรจุระเบียบวาระการประชุม → เจ้าหน้าที่กลุ่มงานวินิจฉัยและมติฯ (board_sec) ประสานงานรวบรวมเอกสารประกอบวาระ
- **สาเหตุที่ต้องสร้างใหม่:** จากการตรวจสอบยืนยันว่า **ขั้นตอนนี้ไม่มีอยู่ในระบบเลยทั้งสาย 7.1 และ 7.2** — ปัจจุบันเคสทุกเคส (ไม่เร่งด่วน) วิ่งจากเลขาฯ ตรงเข้าประธานฯ แล้วประธานฯ สั่งเข้าคณะอนุกลั่นกรองเสมอ ไม่มีทางลัด ไม่มี gate คัดกรองความยุ่งยากโดย กจ. เลย (`case_admin` ที่มีอยู่ปัจจุบันทำแค่ "กระจายเคสที่เข้าคณะอนุกลั่นกรองแล้วไปยังคณะ 1-8" ไม่เคยตัดสินความยุ่งยาก)
- **ขอบเขต:** ทำทั้งสาย 7.1 และ 7.2 (ตามที่ตกลงใน /grilling เพราะขาดทั้งคู่) โดยใช้ role `case_admin` เดิมทำหน้าที่ทั้งคัดกรองและทำความเห็นเสนอ (ไม่สร้าง role ใหม่)

## 📐 ดีไซน์ที่ตกลงกัน (ยืนยันครบใน /grilling วันที่ 2026-09-17)
1. **สถานะใหม่** `PENDING_CASE_ADMIN_SCREEN` (7.1) / `PENDING_CASE_ADMIN_SCREEN_72` (7.2) — owner `case_admin` — แทรกระหว่างเลขาฯ เซ็น (`SIGN_NORMAL`/`SIGN_NORMAL_72`) กับเข้าคิวประธานฯ เดิม (`PENDING_CHAIRMAN`/`PENDING_CHAIRMAN_72`)
2. **Transition ที่ต้องเปลี่ยน:** `SIGN_NORMAL`/`SIGN_NORMAL_72` (secgen) เปลี่ยนปลายทางจาก `PENDING_CHAIRMAN(_72)` เป็น `PENDING_CASE_ADMIN_SCREEN(_72)` แทน
3. **Transition ใหม่จาก `PENDING_CASE_ADMIN_SCREEN(_72)` (actor `case_admin`):**
   - `SCREEN_COMPLEX`/`SCREEN_COMPLEX_72` (ยุ่งยาก) → `IN_SCREENING`/`IN_SCREENING_72` (จุดเดิมที่มีอยู่แล้ว ไม่ต้องแก้อะไรต่อจากนี้)
   - `SCREEN_ASSIGN`/`SCREEN_ASSIGN_72` (ไม่ยุ่งยาก, case_admin เขียนความเห็นเสนอไปด้วยในขั้นนี้) → `PENDING_CHAIRMAN_ASSIGN`/`PENDING_CHAIRMAN_ASSIGN_72` (สถานะใหม่)
4. **สถานะใหม่** `PENDING_CHAIRMAN_ASSIGN(_72)` — owner `chairman` — ใช้หน้า **`chairman-agenda.html` เดิม** (ไม่สร้างหน้าใหม่) โดยให้ `kase.subOutcome`/`kase.subOpinion` (ฟิลด์ที่หน้านี้อ่านอยู่แล้วเพื่อแสดงความเห็นอนุกลั่นกรอง) ถูกเขียนจากความเห็นของ case_admin แทน — เพราะเคสสายนี้ไม่เคยผ่านคณะอนุกลั่นกรองเลย
5. **Transition ใหม่:** `SIGN_ASSIGN`/`SIGN_ASSIGN_72` (chairman ลงนามมอบหมาย) → `AGENDA_SET` (7.1) / `PENDING_INVITE_72` (7.2) — **จุดเดียวกับที่ปลายทางของ flow คณะอนุกลั่นกรองใช้อยู่แล้ว** (7.1: `IN_SCREENING --SCREENING_RESOLVED--> AGENDA_SET`; 7.2: `IN_SCREENING_72 --SCREEN_DONE_72--> PENDING_SIGN_AGENDA_72 --SIGN_AGENDA_72--> PENDING_INVITE_72`) — ดังนั้นทางลัดของ 7.2 จะข้าม `PENDING_SIGN_AGENDA_72` ไปที่ `PENDING_INVITE_72` ตรงๆ เพราะประธานฯ ได้ลงนามที่ `PENDING_CHAIRMAN_ASSIGN_72` ไปแล้ว
6. **Field ใหม่บน case object:** `directAssign: true` (คู่กับ `subCommittee: null`) เพื่อบันทึกว่าเคสนี้มาจากทางลัด ไม่ได้ผ่านคณะอนุกลั่นกรองจริง — ใช้เพื่อ audit/แสดงผลต่างจากเคสที่ผ่านอนุกลั่นกรองจริง (เช่น badge บนหน้า agenda-registry.html ถ้าต้องการภายหลัง แต่ไม่บังคับต้องทำ UI ใหม่ตอนนี้)
7. **หน้าจอที่ case_admin ใช้คัดกรอง:** ขยาย `case-admin-detail.html`/`case-admin-inbox.html` เดิม (ไม่สร้างหน้าใหม่) ให้รองรับสถานะ `PENDING_CASE_ADMIN_SCREEN(_72)` เพิ่มจาก `IN_SCREENING`/`IN_SCREENING_72` ที่มีอยู่แล้ว — เพิ่ม action คัดกรองความยุ่งยาก (radio ยุ่งยาก/ไม่ยุ่งยาก) + ช่องกรอกความเห็นเสนอ (บังคับกรอกเมื่อเลือกไม่ยุ่งยาก เพราะต้องใส่ใน `subOpinion`)

## 📂 2. Affected Routes & Modules
- [x] `assets/ecmis-app.js` — STATUS/STATUS_CODE/TRANSITIONS (เพิ่ม 4 สถานะใหม่ตามข้อ 1,4 x2 สาย), แก้ `SIGN_NORMAL`/`SIGN_NORMAL_72` ปลายทาง, PAGE_FOR/PAGE_FOR_72/pageForCaseByStatus (map สถานะใหม่ไปหน้าเดิม), `CASE_ADMIN_SCREEN_STATUSES`/`isCaseAdminQueue`/`caseAdminRouted` (ขยายให้ครอบคลุมสถานะคัดกรองความยุ่งยากใหม่ด้วย ถ้าจำเป็น — ต้องแยกให้ชัดจากคิวเดิมที่เป็น "กระจายเข้าคณะ" ไม่ให้ปนกัน)
- [x] `case-admin-inbox.html` + `res/` — แสดงคิวใหม่ (สถานะ `PENDING_CASE_ADMIN_SCREEN(_72)`)
- [x] `case-admin-detail.html` + `res/` — เพิ่ม step คัดกรองความยุ่งยาก (ยุ่งยาก/ไม่ยุ่งยาก + ช่องความเห็นเสนอเมื่อไม่ยุ่งยาก)
- [x] `chairman-agenda.html` + `res/` — เพิ่ม branch รองรับสถานะ `PENDING_CHAIRMAN_ASSIGN(_72)` (ใช้ UI/label เดิมที่อ่าน `subOutcome`/`subOpinion` อยู่แล้ว เปลี่ยนแค่ปุ่ม action ให้ตรงกับ transition `SIGN_ASSIGN(_72)` และปลายทางสถานะใหม่)
- [x] `approval-review.html` — ไม่ต้องแก้ (secgen's `SIGN_NORMAL` เรียก TRANSITIONS/STATUS_CODE จาก ecmis-app.js อยู่แล้ว จะได้ปลายทางใหม่อัตโนมัติเมื่อแก้ STATUS_CODE/TRANSITIONS)
- [x] CLAUDE.md section 5 (`case_admin` description) — เพิ่มคำอธิบายหน้าที่ใหม่นี้ให้ครบ

## 🛡️ 3. The 6 Golden Anti-Regression Pre-Check
- [x] 1. ไม่กระทบคอลัมน์ "ประเภทเรื่อง"
- [x] 2. ไม่เปิด agenda-registry.html ให้ chairman/affairs (ไม่เกี่ยวข้องกับงานนี้)
- [x] 3. ใช้ ECMIS.getSupabaseClient() เท่านั้น
- [x] 4. รัน npm run sync หลังแก้ Root
- [x] 5. ไม่แตะ A4 geometry
- [x] 6. ไม่ bypass pre-commit hook

## 📝 4. Step-by-Step Implementation Tasks
- [x] Task 1: อ่านโค้ดปัจจุบันทั้งหมดที่เกี่ยวข้องให้ครบก่อนแก้ — `SIGN_NORMAL`/`SIGN_NORMAL_72` ใน approval-review.html, STATUS/TRANSITIONS ที่เกี่ยวข้องทั้งหมดใน ecmis-app.js, `case-admin-inbox.html`/`case-admin-detail.html` เดิม (โครงสร้าง step/modal), `chairman-agenda.html` เดิม (การอ่าน subOutcome/subOpinion, ปุ่ม action)
- [x] Task 2: เพิ่มสถานะใหม่ 4 ตัวใน STATUS + STATUS_CODE (เลือกรหัสที่ไม่ชนของเดิม) — `PENDING_CASE_ADMIN_SCREEN`, `PENDING_CASE_ADMIN_SCREEN_72`, `PENDING_CHAIRMAN_ASSIGN`, `PENDING_CHAIRMAN_ASSIGN_72`
- [x] Task 3: แก้ TRANSITIONS — `SIGN_NORMAL`/`SIGN_NORMAL_72` ปลายทางใหม่, เพิ่ม `SCREEN_COMPLEX(_72)`, `SCREEN_ASSIGN(_72)`, `SIGN_ASSIGN(_72)`
- [x] Task 4: แก้ PAGE_FOR/PAGE_FOR_72/pageForCaseByStatus ให้สถานะใหม่ map ไปหน้าเดิม (`case-admin-inbox.html`/`case-admin-detail.html` สำหรับ SCREEN, `chairman-agenda.html` สำหรับ ASSIGN)
- [x] Task 5: ขยาย `case-admin-inbox.html`/`case-admin-detail.html` ให้รองรับคิวคัดกรองความยุ่งยากใหม่ (แยกจากคิว "กระจายเข้าคณะ" เดิมให้ชัดเจน ไม่ปนกัน)
- [x] Task 6: ขยาย `chairman-agenda.html` ให้รองรับสถานะ `PENDING_CHAIRMAN_ASSIGN(_72)` (ใช้ subOutcome/subOpinion ที่ case_admin เขียน, ปุ่ม "ลงนามมอบหมาย")
- [x] Task 7: ตั้งค่า `directAssign: true` + `subCommittee: null` เมื่อ case_admin เลือก "ไม่ยุ่งยาก"
- [x] Task 8: อัปเดต CLAUDE.md section 5 (`case_admin`)
- [x] Task 9: `npm run sync` + `npm test` (5-layer CI)
- [x] Task 10: ทดสอบ manual/reading-level ครบ flow ทั้ง 4 เส้นทาง (7.1 ยุ่งยาก, 7.1 ไม่ยุ่งยาก, 7.2 ยุ่งยาก, 7.2 ไม่ยุ่งยาก) ตรวจว่าไม่ regress เคสเดิมที่ผ่านคณะอนุกลั่นกรองจริง
- [x] Task 11: commit (ไม่ push)

## 🧪 5. Verification & Quality Gate Matrix
- [x] Manual/reading-level walkthrough ตาม Task 10
- [x] Dual-Route Sync: npm run sync
- [x] Enterprise CI (5-Layer): npm test ผ่าน 100%

## 🏁 6. Completion & Sign-off
- **Completed Date:** 2026-09-17
- **Commit Reference:** ดู `git log` commit `feat(case-admin): add complexity screening gate before chairman (7.1/7.2)`
- **Summary:** เพิ่ม gate คัดกรองความยุ่งยากโดย กบค. (case_admin) ก่อนถึงประธานฯ ครบทั้งสาย 7.1/7.2 ตามดีไซน์ที่ตกลงไว้ทุกข้อ:
  - สถานะใหม่ 4 ตัว: `PENDING_CASE_ADMIN_SCREEN`(023) / `PENDING_CASE_ADMIN_SCREEN_72`(121) / `PENDING_CHAIRMAN_ASSIGN`(024) / `PENDING_CHAIRMAN_ASSIGN_72`(122)
  - `SIGN_NORMAL`/`SIGN_NORMAL_72` เปลี่ยนปลายทางเป็น gate ใหม่ (เฉพาะเส้นทาง "สำนวนปกติ" เสนอตรงจากเลขาธิการฯ — เคสที่ผ่านคณะอนุสนับสนุนฯ มาแล้ว หรือเป็น 7.3 ยังคงเข้า `PENDING_CHAIRMAN(_72)` ตรงตามเดิม)
  - Transition ใหม่ `SCREEN_COMPLEX(_72)`, `SCREEN_ASSIGN(_72)`, `SIGN_ASSIGN(_72)` ครบ
  - `case-admin-inbox.html`/`case-admin-detail.html` มีคิว "คัดกรองความยุ่งยาก" แยกจากคิว "กระจายเข้าคณะ" เดิมชัดเจน (queue switcher + KPI/action แยกกัน)
  - `chairman-agenda.html` มี step ใหม่ `isDirectAssignSignStep()` ใช้ UI บันทึกข้อความแบบเดียวกับ `isDocketSignStep()` (สลับข้อความอ้างอิงหน่วยงานเป็นกองบริหารคดีแทนคณะอนุกลั่นกรองฯ เมื่อมาจากทางลัด) ปุ่ม "ลงนามมอบหมาย" → `SIGN_ASSIGN(_72)`
  - `directAssign: true` + `subCommittee: null` ถูกตั้งเมื่อ กบค. เลือก "ไม่ยุ่งยาก"
  - `inbox.html` (คิวประธานฯ): `isChairActionable`/KPI/filter เพิ่ม `PENDING_CHAIRMAN_ASSIGN(_72)` ครบ
  - `npm run sync` + `npm test` (5-layer CI) ผ่านทั้งหมด
  - ตรวจ 4 เส้นทอง (7.1 ยุ่งยาก/ไม่ยุ่งยาก, 7.2 ยุ่งยาก/ไม่ยุ่งยาก) ด้วยการอ่านโค้ด TRANSITIONS โดยตรง — ครบทั้ง 4 เส้นทาง ไม่กระทบเคสเดิมที่อยู่ที่ `PENDING_CHAIRMAN(_72)`/`IN_SCREENING(_72)` อยู่ก่อนแล้ว (สถานะเหล่านี้และ transition เดิมไม่ถูกแก้ไข มีแต่เพิ่มสถานะ/ทางแยกใหม่)
  - หมายเหตุ: `review.html` (หน้า legacy คู่ขนานกับ `approval-review.html`) ยังใช้ `PENDING_CHAIRMAN` ตรงๆ แบบเดิม — ไม่ได้แก้เพราะไม่มี routing function ใดชี้ไปหน้านี้จริงในระบบปัจจุบัน (dead code) จึงไม่กระทบ 4 เส้นทางที่ใช้งานจริง
