# 📋 Task Plan: สาย 7.2 — ประธานฯ ลงรับและคัดกรองสำนวน (แทน กจ./affairs)

> **Plan ID:** `2026-09-30-72-chairman-intake-screening`
> **Date:** 2026-09-30
> **Author / Agent:** Claude Code (Sonnet 5.5)
> **Status:** Completed (2026-09-30) — ทดสอบ E2E ทั้งสองทาง (ไม่ซับซ้อน 121→109, ซับซ้อน 121→108) + case_admin + affairs + regression ผ่าน
> **Branch / PR:** `main` (commit local, ไม่ push)

---

## 🎯 1. Problem Statement

Flow 7.2 เปลี่ยน: เดิม **กองบริหารคดี (กลุ่มงานกิจการคณะกรรมการ / `affairs`)** ลงรับและคัดกรองความยุ่งยากของสำนวนหลังเลขาธิการฯ ลงนาม
ปัจจุบันเปลี่ยนเป็น **ประธานกรรมการ ป.ป.ท. (`chairman`)** ลงรับและคัดกรองเอง

### 1.1 ข้อตัดสินใจที่ล็อกแล้ว (ผู้ใช้ยืนยันผ่าน AskUserQuestion /grill-me 2026-09-30)
| # | เรื่อง | ข้อสรุป |
|---|---|---|
| D1 | ขอบเขต | แทนเฉพาะด่านคัดกรองความยุ่งยากของ affairs (`PENDING_CASE_ADMIN_SCREEN_72`, รหัส 121) |
| D2 | ทางเลือกหลังคัดกรอง | คง 2 ทางเดิม: ซับซ้อน → คณะอนุกลั่นกรอง / ไม่ซับซ้อน → มอบหมายและบรรจุวาระ |
| D3 | บทบาทเดิม | affairs เลิกเห็นคิวคัดกรอง 7.2 ต้นทาง แต่ยังทำงานปลายทาง (รายงานชี้มูล / ส่ง ป.วินัย) และสาย 7.1 |
| D4 | ขั้น 122 (`PENDING_CHAIRMAN_ASSIGN_72`) | ยุบรวม: คัดกรอง + ลงนามมอบหมายในหน้าเดียว → `PENDING_INVITE_72` ตรง |
| D5 | หน้าจอ | ใช้ `affairs-case-detail.html` เดิม เปิดสิทธิ์ให้ chairman |
| D6 | เคสค้าง 121 (9310/2569) | ไม่ migrate — owner อิงจากสถานะ จะโผล่คิวประธานอัตโนมัติ |
| D7 | "ลงรับ" | ไม่แยกขั้น — กดรับ+คัดกรองในขั้นเดียว |
| D8 | กำหนดคณะ 1–8 (ทางซับซ้อน) | เข้า `IN_SCREENING_72` (`subCommittee=null`) แล้ว `case_admin` กำหนดคณะเหมือนเดิม |
| D9 | สาย 7.1 | ไม่แตะ |

---

## 🔎 2. สภาพปัจจุบัน (ตรวจจากโค้ด)

- `assets/ecmis-app.js:217` STATUS `PENDING_CASE_ADMIN_SCREEN_72` owner `affairs`
- `ecmis-app.js:395` `SCREEN_COMPLEX_72` (actor affairs) → `IN_SCREENING_72`; `:397` `SCREEN_ASSIGN_72` (actor affairs) → `PENDING_CHAIRMAN_ASSIGN_72`(122); `:399` `SIGN_ASSIGN_72` (chairman) 122 → `PENDING_INVITE_72`
- `ecmis-app.js:562` `AFFAIRS_COMPLEXITY_STATUSES`, `:730` PAGE_FOR_72 → `affairs-case-detail.html`, `:3484` PAGE_PERMISSIONS `['affairs']`
- `affairs-case-detail.html` `openComplexityModal()` — ไม่ซับซ้อนต้องกรอก "ความเห็นเสนอ" (affairs เสนอประธานฯ) แล้วเข้า 122
- `chairman-agenda.html:362` คิวประธานฯ ของ 122; `inbox.html` KPI/filter/badge ของ affairs (`isAffairsComplexityQueue`) และของ chairman
- DB: มีเคสค้าง 121 = 1 เรื่อง (9310/2569); constraint รับรหัส 3 หลักแล้ว ไม่ต้องแก้ DB

---

## 🛠️ 3. แผนงาน (Stages)

### Stage 1 — State machine (`assets/ecmis-app.js`)
- STATUS 121: owner `affairs` → `chairman`, label "รอประธานฯ ลงรับ / คัดกรอง (วินิจฉัยชี้มูล)"
- TRANSITIONS: `SCREEN_COMPLEX_72` actor → `chairman`; เพิ่ม `SIGN_ASSIGN_72` แบบ 121 → `PENDING_INVITE_72` (actor chairman, ข้าม 122); **คง** transition 122 → `PENDING_INVITE_72` และ STATUS 122 ไว้รองรับเคสเก่า; ปรับ/เลิกใช้ `SCREEN_ASSIGN_72` (actor affairs) ให้สอดคล้อง
- `AFFAIRS_COMPLEXITY_STATUSES` → เปลี่ยนเป็นคิวประธานฯ (เปลี่ยนชื่อ helper ถ้าไม่กระทบเยอะ) + ตรวจ `canViewCase`/`canAct` ของ chairman/affairs
- `PAGE_PERMISSIONS['affairs-case-detail.html']` → `['chairman']` (ตรวจก่อนว่าไม่มีลิงก์อื่นของ affairs ชี้มาหน้านี้)

### Stage 2 — หน้า `affairs-case-detail.html`
- modal คัดกรอง: ผู้ใช้เป็น chairman; ตัวเลือก "ไม่ซับซ้อน" เปลี่ยนเป็น **ลงนามมอบหมาย / บรรจุวาระ** (ใช้ `ECMIS.signDialog` + `SignatureStore` ตามแพทเทิร์นเดียวกับ `chairman-agenda.html` — ต้องอ่านโค้ดขั้น `SIGN_ASSIGN_72` ที่นั่นก่อนว่าเขียนฟิลด์ใดบ้าง เพื่อคงผลเหมือนเดิม)
- ตัดช่อง "ความเห็นเสนอ" (ประธานไม่เสนอตัวเอง) เปลี่ยนเป็นหมายเหตุ optional
- ทางซับซ้อน: คง `subCommittee` ไม่ตั้งค่า (null) เพื่อเข้าคิว `case_admin` เดิม
- ปรับข้อความ/ชื่อหน้า/ปุ่ม/ป้ายให้เหมาะกับประธานฯ (ไม่ใช้คำว่า "กจ. คัดกรอง"); `pushCaseHistory` note ใหม่
- ลบ side effect `directAssign`/`subOpinion` เดิมหรือคงไว้ตามที่ปลายทางอ่านอยู่จริง (ตรวจด้วย grep ก่อน)

### Stage 3 — `inbox.html`
- chairman: เพิ่มสถานะ 121 เข้าคิว/KPI/filter/ป้าย ("รอลงรับ/คัดกรอง") และปุ่ม "ดำเนินการ" ไป `affairs-case-detail.html`
- affairs: ถอดการ์ด KPI + ตัวเลือก filter + ป้าย "รอคัดกรองความยุ่งยาก" ของ 7.2 (ตรวจว่าการ์ดนี้ไม่ผูกกับสาย 7.1)
- `chairman-agenda.html`: ตรวจว่าคิว 122 เดิมยังทำงานสำหรับเคสเก่า

### Stage 4 — ทดสอบ
1. seed เคสทดสอบรูปแบบ `****/****` (เช่น 9411/2569, 9412/2569) ที่สถานะ 121 (ห้ามใช้ TEST-xxx; soft-delete `is_deleted=true` เมื่อเสร็จ ห้ามพึ่ง DELETE)
2. E2E ในเบราว์เซอร์: chairman (Wichai.Y) เห็นเคสในคิว → **ไม่ซับซ้อน** ลงนาม → `PENDING_INVITE_72` (109) ไม่ผ่าน 122; → **ซับซ้อน** → `IN_SCREENING_72` แล้ว case_admin เห็นในคิวกำหนดคณะ, ส่งเข้าคณะที่ N แล้วโผล่ที่ `subcommittee-inbox`
3. affairs ไม่เห็นคิวคัดกรอง 7.2 แต่ยังเห็น/ทำ RESOLVED_PENDING_72, 115 (เคส 0005/2569 ยังส่ง ป.วินัยได้)
4. เคสค้าง 9310/2569 โผล่คิวประธานฯ; เคสเก่าที่ 122 ยังลงนามได้
5. Regression: สาย 7.1 (inbox ทุก role, secgen/chairman/dir_case/case_admin), event log `from_status` ถูกต้อง, ไม่มี console error
6. `npm run sync` → `npm test` (5/5) → `npm run test:integration` (60/60; ตรวจว่ามีเทสต์อ้างอิง 121/122 ต้องปรับหรือไม่)

### Stage 5 — ปิดงาน
- commit local `main` (ไม่ push, ไม่ `--no-verify`), ไม่แตะ `CLAUDE.md` (skip-worktree) — ข้อความ role `affairs`/`chairman` ใน CLAUDE.md ให้แจ้งผู้ใช้ปรับเอง
- บันทึก Obsidian Task 121 (ตัวแทน AI: Claude Code) ลงไฟล์รายวัน + ตาราง index กลาง
- อัปเดต Status ของ plan นี้เป็น Completed

---

## ⚠️ 4. ความเสี่ยง / ข้อสังเกต
- **ประธานฯ เป็นคอขวด:** ทุกสำนวน 7.2 ปกติต้องผ่านประธานฯ ก่อน (ผลของนโยบาย ไม่ใช่บั๊ก) — ควรแจ้งผู้ใช้เมื่อเดโม
- **`case_admin` กับ 7.2:** ยังเห็นเฉพาะช่วง `IN_SCREENING_72 && !subCommittee` (D8) สอดคล้องกับ D3 ที่ถอดเฉพาะ "ต้นทาง"
- **ข้อความ SLA / stepper** (`STATUS_STEP_72` 121 → `agenda72`) ไม่เปลี่ยนโครงสร้าง
- ชื่อสถานะ/รหัสเดิมคงไว้ทั้งหมดเพื่อไม่ต้อง migrate DB
