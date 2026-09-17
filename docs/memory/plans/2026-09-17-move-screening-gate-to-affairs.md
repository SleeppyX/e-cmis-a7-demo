# 📋 Task Plan: ย้ายขั้นคัดกรองความยุ่งยากจาก case_admin ไป affairs (กลุ่มงานกิจการคณะกรรมการ)

> **Plan ID:** `2026-09-17-move-screening-gate-to-affairs`
> **Date:** 2026-09-17
> **Author / Agent:** Claude Code (ผ่าน /grilling)
> **Status:** Done
> **Branch / PR:** `main`

---

## 🎯 1. Problem Statement & Business Objective
- **ข้อผิดพลาดที่ต้องแก้:** งานก่อนหน้า (`2026-09-17-case-admin-complexity-gate.md`, commit `1b330ce`/`d17cc5f`) เขียนให้ role `case_admin` ("กบค.กลุ่มงานบริหารคดีและบริหารทั่วไป", login Kannika.W) เป็นคนทำขั้น "ลงรับและคัดกรองสำนวนว่ายุ่งยากหรือไม่" — **ผิด** ตามผังจริงของผู้ใช้ ขั้นนี้ต้องเป็นของ **"กลุ่มงานกิจการคณะกรรมการ"** ซึ่งในระบบคือ role `affairs` (login Siriporn.K) ที่มีอยู่แล้วจริง (ไม่ใช่ role ใหม่ ไม่ใช่แค่ label ในเอกสาร — เป็น role login จริงที่ต้องทำหน้าที่นี้เอง)
- **สิ่งที่ยังถูกต้องและไม่ต้องแตะ:** `case_admin` ยังคงทำหน้าที่ "ส่งเข้าคณะอนุกลั่นกรองฯ" (กระจายเคสที่อยู่ `IN_SCREENING`/`IN_SCREENING_72` ไปยังคณะ 1-8) เหมือนเดิม — คิว "กระจายเข้าคณะ" ของ case_admin ที่มีอยู่ก่อนงานนี้แล้วไม่ต้องแก้อะไร
- **การเชื่อมต่อ (ยืนยันแล้ว ไม่ต้องสร้างขั้นใหม่):** เมื่อ affairs เลือก "ยุ่งยาก" เคสเข้า `IN_SCREENING`/`IN_SCREENING_72` เหมือนเดิมทุกประการ → เคสจะไปโผล่ในคิว "กระจายเข้าคณะ" ของ case_admin โดยอัตโนมัติอยู่แล้ว (กลไกเดิมที่มีมาก่อนงานนี้) ไม่ต้องมีขั้นส่งมอบระหว่าง affairs → case_admin เพิ่ม

## 📐 ดีไซน์ที่ตกลงกันใน /grilling (2026-09-17)
1. เปลี่ยน owner ของสถานะ `PENDING_CASE_ADMIN_SCREEN` / `PENDING_CASE_ADMIN_SCREEN_72` จาก `case_admin` เป็น `affairs` (**ไม่เปลี่ยนชื่อ key ของสถานะ** เพื่อไม่กระทบรหัส Supabase ที่เพิ่ง migrate ไป — แก้แค่ field `owner` และ routing)
2. ย้าย UI คัดกรองความยุ่งยาก (modal เลือกยุ่งยาก/ไม่ยุ่งยาก + ช่องความเห็นเสนอ) จาก `case-admin-inbox.html`/`case-admin-detail.html` ไปที่ **`inbox.html`** (หน้าที่ affairs ใช้อยู่แล้วสำหรับคิว RESOLVED/RESOLVED_PENDING_72) — เพิ่มคิว/การ์ด KPI ใหม่ในหน้านี้สำหรับ affairs โดยเฉพาะ
3. ลบ/ถอนโค้ดคิว "คัดกรองความยุ่งยาก" ที่เพิ่งเพิ่มไปใน `case-admin-inbox.html`/`case-admin-detail.html` ออก (คืนสองไฟล์นี้ให้เหลือแค่หน้าที่ "กระจายเข้าคณะ" เดิมอย่างเดียว)
4. อัปเดต `PAGE_FOR`/`PAGE_FOR_72`/`pageForCaseByStatus`/`PAGE_PERMISSIONS` ให้สถานะ `PENDING_CASE_ADMIN_SCREEN(_72)` ชี้ไป `inbox.html` และอนุญาต role `affairs` (ถอนสิทธิ์ `case_admin` ออกจากสถานะนี้ถ้าเคยเพิ่มไว้เฉพาะจุด)
5. แก้ actor label ในเอกสาร/บันทึกข้อความที่ chairman เห็น (`chairman-agenda.html`) จาก "กองบริหารคดี (กลุ่มงานบริหารคดีและบริหารทั่วไป)" เป็นข้อความที่ตรงกับ affairs/กลุ่มงานกิจการคณะกรรมการ
6. อัปเดต `CLAUDE.md` section 5 ทั้งสอง role (`affairs` เพิ่มหน้าที่นี้, `case_admin` ตัดหน้าที่นี้ออก)

## 📂 2. Affected Routes & Modules
- [x] `assets/ecmis-app.js` — STATUS owner (2 จุด), PAGE_FOR_72/pageForCaseByStatus, PAGE_PERMISSIONS
- [x] `case-admin-inbox.html` + `res/` — ถอนคิว/โค้ดคัดกรองความยุ่งยากที่เพิ่งเพิ่มออก (checkout กลับไป commit `00d734a` ก่อน gate เดิม — diff เป็น 0)
- [x] `case-admin-detail.html` + `res/` — ถอนโค้ดที่เพิ่งเพิ่มออก (ถ้ามี)
- [x] `inbox.html` + `res/` — เพิ่มคิว/KPI/modal คัดกรองความยุ่งยากสำหรับ affairs (ย้ายจาก case-admin-inbox.html มาปรับให้เข้ากับ pattern ของ inbox.html)
- [x] `chairman-agenda.html` + `res/` — แก้ actor label ในเอกสารให้ตรง affairs
- [x] `CLAUDE.md` section 5

## 🛡️ 3. The 6 Golden Anti-Regression Pre-Check
- [x] 1. ไม่กระทบคอลัมน์ "ประเภทเรื่อง"
- [x] 2. ไม่เปิด agenda-registry.html ให้ chairman/affairs (ยังคงเดิม — งานนี้ไม่เกี่ยวกับ agenda-registry.html)
- [x] 3. ใช้ ECMIS.getSupabaseClient() เท่านั้น
- [x] 4. รัน npm run sync หลังแก้ Root
- [x] 5. ไม่แตะ A4 geometry
- [x] 6. ไม่ bypass pre-commit hook

## 📝 4. Step-by-Step Implementation Tasks
- [x] Task 1: อ่านโค้ดที่เพิ่งเพิ่มในงานก่อนหน้าทั้งหมดให้ครบ (`case-admin-inbox.html`/`case-admin-detail.html` ส่วนคัดกรอง, `chairman-agenda.html` ส่วน isDirectAssignSignStep, STATUS/PAGE_FOR ที่เกี่ยวข้อง) ก่อนแก้
- [x] Task 2: แก้ owner ใน STATUS ของ `PENDING_CASE_ADMIN_SCREEN`/`PENDING_CASE_ADMIN_SCREEN_72` เป็น `affairs`
- [x] Task 3: แก้ PAGE_FOR_72/pageForCaseByStatus ให้ 2 สถานะนี้ชี้ไป `inbox.html`, แก้ PAGE_PERMISSIONS ให้ `affairs` เข้าถึงได้ (inbox.html อนุญาต affairs อยู่แล้วเป็นการทั่วไป — ไม่ต้องแก้เพิ่ม)
- [x] Task 4: ถอนโค้ดคิวคัดกรองความยุ่งยากออกจาก `case-admin-inbox.html`/`case-admin-detail.html` ทั้งหมด (KPI, toggle, modal, filter ที่เพิ่งเพิ่ม) — ทำด้วย `git checkout 00d734a -- case-admin-inbox.html case-admin-detail.html res/case-admin-inbox.html res/case-admin-detail.html`
- [x] Task 5: ย้าย modal คัดกรองความยุ่งยาก (เนื้อหาเดิมจาก `openComplexityModal()`) มาไว้ที่ `inbox.html` ผูกกับ role `affairs`, เพิ่ม KPI card คิว "รอคัดกรองความยุ่งยาก" ในหน้า inbox ของ affairs ตาม pattern ที่มีอยู่แล้วในไฟล์นี้ (สร้าง `computeQueues()` แยกจาก `main()` เพื่อให้ modal เรียก refresh ซ้ำได้)
- [x] Task 6: แก้ actor label ในเอกสารที่ `chairman-agenda.html` แสดง (บันทึกข้อความส่วนราชการ/ผู้เสนอความเห็น) ให้ตรงกับ affairs/กลุ่มงานกิจการคณะกรรมการ แทน "กองบริหารคดี (กลุ่มงานบริหารคดีและบริหารทั่วไป)"
- [x] Task 7: อัปเดต CLAUDE.md section 5 (`affairs` และ `case_admin`)
- [x] Task 8: `npm run sync` + `npm test` (5-layer CI) — ผ่านทั้งหมด (Errors: 0, Warnings: 0)
- [x] Task 9: ทดสอบ reading-level: affairs เห็นคิวใหม่ใน inbox.html (KPI + dropdown + modal ผูก role affairs), คัดกรองยุ่งยาก/ไม่ยุ่งยากคง transition/validation เดิมทุกจุด, case-admin-inbox.html/detail.html กลับไป byte-identical กับก่อน gate เดิม (`git diff 00d734a` ว่างเปล่า) จึงยังเห็นคิว "กระจายเข้าคณะ" ปกติ (รวมเคสที่ affairs ส่งมาทาง `IN_SCREENING`/`IN_SCREENING_72` โดยอัตโนมัติ เพราะ `isCaseAdminQueue`/`CASE_ADMIN_SCREEN_STATUSES` ไม่สนใจที่มาของสถานะ), chairman-agenda.html แก้ attribution เป็น "กองบริหารคดี (กลุ่มงานกิจการคณะกรรมการ)"/"กลุ่มงานกิจการคณะกรรมการ" ครบทุกจุดที่ isDirectAssignSignStep() ใช้ — ไม่ได้ทำ live browser click-through (bonus step) เนื่องจากข้อจำกัดเวลา แต่ตรวจ logic ระดับ read ครบทุกจุดที่แก้
- [x] Task 10: commit (ไม่ push)

## 🧪 5. Verification & Quality Gate Matrix
- [~] Manual/reading-level walkthrough ตาม Task 9 — ทำเฉพาะ reading-level (ไม่ได้ live click-through ผ่าน browser จริง)
- [x] Dual-Route Sync: npm run sync (synced chairman-agenda.html, inbox.html — case-admin ไฟล์คู่ root/res ตรงกันอยู่แล้วจากการ checkout)
- [x] Enterprise CI (5-Layer): npm test ผ่าน 100% (Errors: 0, Warnings: 0)

## 🏁 6. Completion & Sign-off
- **Completed Date:** 2026-09-17
- **Commit Reference:** see `git log` — commit created by this task (fix(roles): move complexity screening gate from case_admin to affairs)
- **Notes:** สถานะ `PENDING_CASE_ADMIN_SCREEN(_72)` และรหัส Supabase (023/121) คงชื่อเดิมไว้แม้ owner จะเปลี่ยนเป็น affairs แล้ว (ไม่ต้อง migrate DB เพิ่ม เพราะรหัสสถานะ (numeric code) ไม่เปลี่ยน มีแค่ role เจ้าของเปลี่ยน). ตัวแปร/ฟังก์ชันภายใน `assets/ecmis-app.js` ที่เคยชื่อ `CASE_ADMIN_COMPLEXITY_STATUSES`/`isCaseAdminComplexityQueue` เปลี่ยนชื่อเป็น `AFFAIRS_COMPLEXITY_STATUSES`/`isAffairsComplexityQueue` ให้ตรงกับ owner ใหม่ (ไม่กระทบ Supabase เพราะเป็นแค่ชื่อฟังก์ชัน/ตัวแปร JS ล้วนๆ ไม่ผูกกับ DB).
