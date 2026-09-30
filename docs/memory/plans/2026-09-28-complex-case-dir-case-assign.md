# 📋 Task Plan: สำนวนซับซ้อน (7.1/7.2) — ผอ.กบค. ออกเลขทะเบียนคุมและมอบหมายคณะอนุสนับสนุน

> **Plan ID:** `2026-09-28-complex-case-dir-case-assign`
> **Date:** 2026-09-28
> **Author / Agent:** Claude Code (Opus 5.5)
> **Status:** Completed (2026-09-30) — ผู้ใช้รัน SQL ALTER แล้ว, ทดสอบ E2E ครบทั้ง 7.1/7.2 ผ่าน (ดู §6 Stage 5b)
> **Branch / PR:** `main`

---

## 🎯 1. Problem Statement & Business Objective

- **ความต้องการ (จาก /grill-me 2026-09-28 + flowchart ที่ผู้ใช้แนบ):** เมื่อเลขาธิการฯ ตัดสินว่าสำนวน "ซับซ้อน"
  ต้องส่งให้ **ผู้อำนวยการกองบริหารคดี (ผอ.กบค. / `dir_case`)** เป็นผู้ **ทำเลขทะเบียนคุม** และ **จ่ายงานให้กลุ่มอนุสนับสนุน**
  (เดิมเลขาธิการฯ เป็นคนเลือกคณะที่ 1/2 และจ่ายงานเอง) — แล้วคณะอนุสนับสนุนกลั่นกรอง → ส่ง **ใบบันทึกความเห็นอนุสนับสนุน** กลับเลขาธิการฯ
  → เลขาธิการฯ พิจารณาและลงนามรายงานต่อ
- **ขอบเขต:** ทั้งสาย 7.1 (ไต่สวนเบื้องต้น) และ 7.2 (วินิจฉัยชี้มูล)
- **ข้อกฎหมาย:** พ.ร.บ. มาตรการของฝ่ายบริหารฯ **ม.๒๔ วรรคสาม** — "เรื่องสำคัญหรือมีความซับซ้อน คณะกรรมการ ป.ป.ท. จะแต่งตั้ง
  คณะอนุกรรมการไต่สวน**ตามข้อเสนอแนะของเลขาธิการ**" → อำนาจวินิจฉัยความซับซ้อนเป็นของเลขาธิการฯ, ผอ.กบค. ไม่ปรากฏใน พ.ร.บ.
  (ตำแหน่งบริหารภายใน) → บทบาท ผอ.กบค. ในขั้นนี้เป็น **งานปฏิบัติการล้วน ไม่มีอำนาจตีกลับ**

### 1.1 ข้อตัดสินใจที่ล็อกแล้ว (ผู้ใช้ยืนยันผ่าน AskUserQuestion)
| # | เรื่อง | ข้อสรุป |
|---|---|---|
| D1 | ขอบเขตสาย | 7.1 และ 7.2 |
| D2 | ทางตีกลับของ ผอ.กบค. | **ไม่มี** — รับเสมอ (ตามฐาน ม.๒๔) |
| D3 | เลขทะเบียนคุม | ระบบออกอัตโนมัติ รูปแบบ `ทค.<ลำดับ>/<ปี พ.ศ.>` เช่น `ทค.1/2569` รันใหม่ทุกปี |
| D4 | เลือกคณะอนุสนับสนุน | ผอ.กบค. เลือกเอง (คณะที่ 1 / คณะที่ 2) เห็นจำนวนงานค้างแต่ละคณะประกอบการตัดสินใจ |
| D5 | ใบบันทึกซับซ้อน | เอกสาร A4 จริง พิมพ์/ส่งออก DOCX ได้ |
| D6 | ใบบันทึกความเห็นอนุสนับสนุน | ใช้ข้อมูลความเห็นเดิมของคณะอนุสนับสนุนขึ้นรูป A4 (ไม่ออกแบบเนื้อหาใหม่) |

---

## 🔎 2. สภาพปัจจุบัน (ตรวจจากโค้ดจริง 2026-09-28)

| จุด | ปัจจุบัน | อ้างอิง |
|---|---|---|
| เลขาฯ จ่ายงาน | `act === 'assign'` + dropdown `#supportSubSelect` (คณะที่ 1/2) → เขียน `status: IN_SUPPORT_SUB(_72)` + `resolutionData.supportSubTeam` ตรงๆ | `approval-review.html:1355-1400` |
| State machine | `SIGN_COMPLEX` / `SIGN_COMPLEX_72` : `PENDING_SECGEN(_72)` → `IN_SUPPORT_SUB(_72)` actor secgen — ไม่มีขั้น dir_case | `ecmis-app.js:252, 348` |
| ผอ.กบค. | มีเฉพาะสายเร่งด่วน (`URGENT_CERTIFY`) — **หน้า `dir-case-support-assign.html` ไม่มีอยู่จริง** (CLAUDE.md §5 เขียนถึงแต่ไม่เคย implement / ถูกลบตอน 2026-09-14 แล้วคืนมาแค่สายเร่งด่วน) | `docs/memory/plans/2026-09-16-restore-dir-case-urgent-review.md` |
| เลขทะเบียนคุม | ไม่มีกลไกใดๆ ในเส้นทางนี้ (`ลงทะเบียนคุมคดี` ของ `case_admin` เป็นคนละระบบ คนละจุดของ flow) | `ecmis-app.js:~533` |
| อนุสนับสนุนส่งคืน | **ส่งคืนเลขาธิการฯ อยู่แล้วในทางปฏิบัติ** (`status: PENDING_SECGEN(_72)` เขียนตรงจากหน้า) — แต่ `TRANSITIONS` ยังเขียนว่าไป `PENDING_CHAIRMAN` (stale) | `support-subcommittee.html:953` vs `ecmis-app.js:266-272, 356-358` |
| ใบบันทึกความเห็นอนุสนับสนุน | **มีเอกสาร A4 + DOCX อยู่แล้ว** ("บันทึกข้อความความเห็นการกลั่นกรอง") | `support-subcommittee.html:195, 747, 1110` |
| อนุสนับสนุนเลือกคณะซ้ำ | หน้าอนุสนับสนุนมีตัวเลือกคณะของตัวเองอีกชั้น (`currentGroup` → `supportTeam`) ทับกับที่เลขาฯ เลือกไว้ | `support-subcommittee.html:340, 937` |
| ใบบันทึกซับซ้อน | ไม่มี — มีแค่ข้อความเหตุผล `g1reason` ของเลขาฯ | `approval-review.html` |
| Supabase CHECK | memory เดิมบอกว่ารหัสสถานะใหม่เคยถูก reject แต่ตอนนี้มีแถว `trr_status='121'` อยู่จริง → constraint น่าจะคลายแล้ว **ต้องยืนยันด้วยการเขียนจริง** | memory `db-trr-status-constraint` |

---

## 🧭 3. Flow เป้าหมาย

```
เลขาธิการฯ (PENDING_SECGEN[_72])
   │  ติ๊ก "ซับซ้อน" + กรอกเหตุผล (g1reason) → [ใบบันทึกซับซ้อน A4]
   ▼  SIGN_COMPLEX[_72]  (actor: secgen)
PENDING_SUPPORT_ASSIGN[_72]   ← สถานะใหม่ owner: dir_case
   │  ผอ.กบค. เปิด dir-case-support-assign.html
   │  → ระบบออกเลข ทค.N/ปี + ผอ.กบค. เลือกคณะที่ 1/2 → ใบบันทึกซับซ้อนประทับเลขทะเบียน+คณะ
   ▼  ASSIGN_SUPPORT_SUB[_72]  (actor: dir_case)   — ไม่มีทางตีกลับ
IN_SUPPORT_SUB[_72]  (owner: support_sub — กลไกเดิม)
   │  คณะอนุสนับสนุนกลั่นกรอง → [ใบบันทึกความเห็นอนุสนับสนุน A4 — มีอยู่แล้ว]
   ▼  (เดิม) เขียน PENDING_SECGEN[_72] กลับ
เลขาธิการฯ พิจารณาและลงนาม (เห็นความเห็นอนุสนับสนุน + เลขทะเบียนคุม)
```

### 3.1 ของใหม่ที่ต้องสร้าง
- **สถานะ:** `PENDING_SUPPORT_ASSIGN` = `'025'` (ข้าม 023/024 ที่เลิกใช้แล้ว ไม่ reuse), `PENDING_SUPPORT_ASSIGN_72` = `'123'` — label "รอ ผอ.กบค. ออกเลขทะเบียนคุม/มอบหมายคณะอนุสนับสนุน", owner `dir_case`
- **Transition:** retarget `SIGN_COMPLEX[_72]` → `PENDING_SUPPORT_ASSIGN[_72]`; เพิ่ม `ASSIGN_SUPPORT_SUB[_72]` (actor `dir_case`) → `IN_SUPPORT_SUB[_72]`
- **ข้อมูลที่บันทึก (`trr_resolution_data`):** `supportControlNo` ("ทค.1/2569"), `supportControlSeq` (1), `supportControlYear` (2569), `supportSubTeam` (ย้ายผู้เขียนจาก secgen → dir_case), `assignedBy: 'dir_case'`, `assignedAtIso`
- **การออกเลข:** ตอนกดยืนยัน — query Supabase หา `supportControlSeq` สูงสุดของปีนั้นใน `trr_resolution_data` → +1 (เดโมผู้ใช้คนเดียว ยอมรับ race condition ได้ ระบุไว้ในคอมเมนต์)
- **หน้าใหม่ `dir-case-support-assign.html`** (+ `/res/` ผ่าน sync) — layout two-pane มาตรฐาน:
  - ซ้าย: สรุปสำนวน, เหตุผลความซับซ้อนของเลขาฯ (อ่านอย่างเดียว), เลขทะเบียนคุม (แสดง "จะออกเลขเมื่อยืนยัน" / เลขจริงหลังออกแล้ว), เลือกคณะที่ 1/2 + จำนวนงานค้างแต่ละคณะ, ปุ่ม "ออกเลขทะเบียนและมอบหมาย"
  - ขวา: A4 **ใบบันทึกซับซ้อน** + toolbar มาตรฐาน (แก้ไขเอกสาร/DOCX/พิมพ์/ขยายเต็มจอ/ย่อแผง) + card collapse ฝั่งซ้าย
- **RBAC:** `PAGE_PERMISSIONS['dir-case-support-assign.html'] = ['dir_case', 'secgen']` (secgen อ่านอย่างเดียว); routing `DIR_CASE_PAGE_FOR_STATUS` / `PAGE_FOR_72` / status→page maps
- **inbox.html (dir_case):** KPI การ์ดใหม่ "รอมอบหมายอนุสนับสนุน" + ลิงก์ดำเนินการไปหน้าใหม่

---

## 📂 4. Affected Routes & Modules

- [ ] `assets/ecmis-app.js` — STATUS, STATUS_CODE, TRANSITIONS, status→page maps (~656, ~713, ~741, ~3184, ~3195), SLA map (~996), PAGE_PERMISSIONS, stepper/FLOW_STEPS, helper ออกเลขทะเบียนคุม
- [ ] `approval-review.html` — เปลี่ยนปุ่ม "มอบหมาย + เลือกคณะ" ของเลขาฯ เป็น "ส่ง ผอ.กบค." (ไม่เลือกคณะ); ตอนเคสกลับมา แสดงเลขทะเบียนคุม + ลิงก์/พรีวิวใบบันทึกความเห็นอนุสนับสนุน
- [ ] `dir-case-support-assign.html` — **ใหม่**
- [ ] `inbox.html` — KPI/queue ของ dir_case, หมวดของ secgen ระหว่างรอ ผอ.กบค.
- [ ] `support-subcommittee.html` — คณะที่ถูกมอบหมายแสดงแบบล็อก (ดู Q-A), แสดงเลขทะเบียนคุมบนเอกสาร
- [ ] `support-subcommittee-inbox.html` — แสดงเลขทะเบียนคุม, ไม่ดึง `PENDING_SUPPORT_ASSIGN` เข้าคิวอนุสนับสนุน
- [ ] `review.html` — จุดที่ทำงานคู่ขนานกับ approval-review (ตรวจว่าต้องแก้ตามหรือไม่)
- [ ] `/res/*` — ผ่าน `npm run sync` เท่านั้น
- [ ] `scripts/` — สคริปต์ seed/test เคสใช้ทดสอบ (ถ้าจำเป็น)
- [ ] **ไม่แตะ `CLAUDE.md`** (skip-worktree) — แจ้งผู้ใช้ว่า §5 เรื่อง `dir-case-support-assign.html` จะตรงกับของจริงหลังงานนี้เสร็จ

---

## 🛡️ 5. The 6 Golden Anti-Regression Pre-Check
- [ ] 1. ไม่กระทบคอลัมน์ "ประเภทเรื่อง" ในตาราง inbox (เพิ่มแค่ KPI การ์ด)
- [ ] 2. ไม่เปิด `agenda-registry.html` ให้ chairman / affairs
- [ ] 3. Supabase ผ่าน `ECMIS.getSupabaseClient()` เท่านั้น (หน้าใหม่ด้วย)
- [ ] 4. `npm run sync` หลังแก้ Root ทุกครั้ง (หน้าใหม่ต้องมีคู่ใน `/res/` — CI ด่าน 2)
- [ ] 5. A4 ใบบันทึกซับซ้อนใช้ `15mm 15mm 18mm 20mm` + ท้ายกระดาษลับ `bottom: 8mm`
- [ ] 6. ไม่ใช้ `--no-verify`

---

## 📝 6. Step-by-Step Implementation (แบ่ง Stage — commit แยกทุก Stage)

### Stage 0 — เตรียมและยืนยันฐานข้อมูล — ⚠️ บล็อกอยู่
- [x] เขียนแถวทดสอบทิ้งด้วย `trr_status='025'`/`'123'` → **ถูก CHECK constraint reject จริง**
      (probe เต็ม 000-024/100-122 คือช่วงที่เขียนได้ตอนนี้)
- [ ] **รอผู้ใช้รัน SQL เอง** (ไม่มีสิทธิ์ DDL ผ่าน anon key):
      ```sql
      ALTER TABLE tbl_res_request DROP CONSTRAINT tbl_res_request_trr_status_check;
      ALTER TABLE tbl_res_request ADD CONSTRAINT tbl_res_request_trr_status_check
        CHECK (trr_status ~ '^[0-9]{3}$');
      ```

### Stage 1 — แกนกลไก สาย 7.1 — ✅ โค้ดเสร็จ, รอ Stage 0 ปลดบล็อกก่อน verify เต็มรูปแบบ
- [x] เพิ่ม `PENDING_SUPPORT_ASSIGN`('025') ใน STATUS/STATUS_CODE/label/SLA/status→page maps (`assets/ecmis-app.js`)
- [x] retarget `SIGN_COMPLEX` → `PENDING_SUPPORT_ASSIGN`, เพิ่ม `ASSIGN_SUPPORT_SUB` (actor `dir_case`, ไม่มีทางตีกลับ)
- [x] `approval-review.html` + `review.html`: ปุ่มเลขาฯ → "ส่ง ผอ.กบค. ออกเลขทะเบียนคุม" (ตัด dropdown เลือกคณะ
      ออก ใช้ `complexReason`/`g1reason` เป็นเหตุผลถึง ผอ.กบค. แทน) — เจอและแก้บั๊ก persistence เดิม 2 จุด
      (`review.html`'s `persistCase()` ไม่เคย merge `resolutionData` ลง Supabase เลย)
- [x] สร้าง `dir-case-support-assign.html` ใหม่ทั้งหน้า (ซ้าย: สรุป/เหตุผล/เลขทะเบียน/เลือกคณะ+ภาระงาน,
      ขวา: เอกสาร A4 ใบบันทึกซับซ้อนเต็มรูปแบบพร้อม DOCX export — Stage 2 รวมมาทำพร้อมกันแล้ว)
- [x] `PAGE_PERMISSIONS['dir-case-support-assign.html']`, `PAGE_FOR_72`, `pageForCaseByStatus`,
      `canViewCase` whitelist ของ dir_case, `inbox.html` routing/KPI/filter ของ dir_case
- [x] **Live-tested (browser)**: กด "ซับซ้อน" → ช่องเหตุผลใหม่โผล่ถูกต้อง (ไม่มี dropdown คณะแล้ว) →
      validation บังคับกรอกเหตุผลทำงานถูกต้อง → dialog/ปุ่มข้อความตรงตามที่ออกแบบ → `persistCase()` throw
      "ไม่พบรหัสสถานะ..." เมื่อ constraint บล็อก (soft-fail pattern เดิมของหน้านี้ยังทำงานถูกต้อง ไม่ crash)
- [ ] **ทดสอบเต็มรูปแบบ end-to-end ค้างอยู่**: ต้องรอ Stage 0 ปลดบล็อกก่อนถึงจะยืนยันได้ว่าสถานะเขียนลง
      Supabase จริง แล้วไปโผล่ในคิว dir_case/หน้า dir-case-support-assign.html/คิวอนุสนับสนุนถูกต้อง

### Stage 2 — เอกสาร A4 ใบบันทึกซับซ้อน — ✅ เสร็จ (ทำรวมกับ Stage 1 ในไฟล์เดียวกัน)
- [x] Template A4 ครบ (เรื่องที่/เรื่อง/ผู้ถูกกล่าวหา/ข้อกล่าวหา/เหตุผลความซับซ้อนของเลขาฯ/อ้าง ม.24 วรรคสาม/
      ลายเซ็นเลขาฯ/ส่วนการดำเนินการของ กบค. — เลขทะเบียนคุม+คณะที่มอบหมาย+ลายเซ็น ผอ.กบค.) + pagination/zoom/
      fullscreen/card-collapse (ใช้ pattern เดียวกับหน้าอื่นทั้งหมดที่ทำไปก่อนหน้านี้ในเซสชันนี้) + DOCX export

### Stage 3 — ขยายสาย 7.2 — ✅ เสร็จ (ทำพร้อม Stage 1 ในไฟล์เดียวกัน ไม่ได้แยก commit ตามแผนเดิม)
- [x] `PENDING_SUPPORT_ASSIGN_72`('123'), retarget `SIGN_COMPLEX_72`, เพิ่ม `ASSIGN_SUPPORT_SUB_72`
- [x] `dir-case-support-assign.html` รองรับ `isCase72` ตั้งแต่แรก (label/สถานะ/เอกสารปรับตามสายอัตโนมัติ)
- [ ] ทดสอบ live สาย 7.2 ครบวง — ค้างเหมือน Stage 1 (รอ Stage 0)

### Stage 4 — ปลายทาง/ความสอดคล้อง — ✅ เสร็จ
- [x] `support-subcommittee.html`: ล็อกคณะตาม `kase.supportSubTeam` ที่ ผอ.กบค. กำหนด ไม่ใช้ persona
      toggle ของ header อีกต่อไปเมื่อมีค่านี้ (Q-A)
- [x] `inbox.html` ฝั่งเลขาฯ: ยืนยันแล้วว่า `PENDING_SUPPORT_ASSIGN[_72]` ตกอยู่ใน bucket 'SIGNED'
      (การ์ด "ลงนามแล้ว") โดยอัตโนมัติอยู่แล้วผ่าน fallback เดิมของ `getSecgenStatusCategory()`
      — **ไม่ต้องแก้โค้ดเพิ่ม** ตรงตาม Q-B (คิวเดิมนับให้แล้ว)
- [x] `support-subcommittee-inbox.html`: แสดงเลขทะเบียนคุมต่อท้ายชื่อหน่วยงานในตาราง
- [x] `approval-review.html`: การ์ด `supportSubResultCard` (ใบบันทึกความเห็นอนุสนับสนุนเดิม) แสดงเลข
      ทะเบียนคุมกำกับคณะผู้กลั่นกรองแล้ว (Q-C)
- [x] แก้ `TRANSITIONS` ของ `IN_SUPPORT_SUB[_72]` ให้ตรงของจริง (`SUPPORT_OPINION_RETURNED[_72]` →
      `PENDING_SECGEN[_72]`) แทนของเดิมที่เขียนผิดไปที่ `PENDING_CHAIRMAN`/`PENDING_URGENT` (Q-D)
- [ ] stepper/FLOW_STEPS ยังไม่ได้เพิ่มขั้น "ผอ.กบค. มอบหมาย" แยกให้เห็นชัดในแถบ progress —
      ปัจจุบันสถานะใหม่ยังไปโผล่ในขั้น `secgen` step เดิม (`STATUS_STEP`) ซึ่งไม่ผิดแต่ไม่ได้เน้นขั้นใหม่
      ให้เห็นชัดตามภาพ flowchart ต้นฉบับ — พิจารณาเพิ่มทีหลังถ้าผู้ใช้ต้องการ (ไม่ critical)

### Stage 5 — Regression + บันทึก
- [x] Live-tested เส้นทางปกติ (ไม่ซับซ้อน) บนเคสทดสอบ — myOpinion box แสดง/เปิดใช้งานถูกต้อง, ปุ่ม/dialog
      ลงนามดิจิทัลทำงานปกติ ไม่มี regression จากการแก้ `onG1Change`/`requireOpinion`
- [x] `npm run sync` + `npm test` ผ่าน 5/5 ทุกรอบระหว่างพัฒนา (38 paired routes, 272 links)
- [x] คืนค่า/ลบแถวทดสอบใน Supabase ครบ (9401/2569, 9402/2569 — สร้างและลบตามฟอร์แมตเลขสำนวนจริงตาม
      feedback ผู้ใช้ 2026-09-28)
- [ ] Obsidian history log — ยังไม่ได้บันทึก (รอปิดงานหลัง Stage 0 ปลดบล็อก)
- [ ] (ตามคำสั่งเท่านั้น) sync เข้า `ecmis/board-resolution`

### Stage 5b — E2E หลังปลดบล็อก DB (2026-09-30) — ✅ ผ่าน
- [x] Constraint ใหม่ `CHECK (trr_status ~ '^[0-9]{3}$')` — probe เขียน `025`/`123` ได้จริง
- [x] **7.1 (9401/2569)**: เลขาฯ ส่ง → `025` + complexReason → inbox ผอ.กบค. KPI/แถว/ลิงก์ถูก → ออกเลข
      `ทค.2/2569` + คณะที่ 2 → `006` → คิวอนุสนับสนุน: คณะที่ 1 ไม่เห็น, คณะที่ 2 เห็นพร้อมเลขทะเบียน →
      ส่งความเห็นจาก persona คณะที่ 1 แต่บันทึก `TEAM2` (lock ทำงาน) → `005` → เลขาฯ เห็นการ์ดผลกลั่นกรอง
      + เลขทะเบียน และปุ่มลงนามส่งต่อ (ไม่วนกลับ ผอ.กบค.)
- [x] **7.2 (9403/2569)**: `104` → `123` → `ทค.3/2569` คณะที่ 1 → `105` → คืน `104` → เลขาฯ เห็นผล + ปุ่มเสนอประธานฯ
- [x] บั๊กที่เจอระหว่าง E2E และแก้แล้ว:
  - `support-subcommittee.html` ใช้ `docType==='RULING'` ตัดสินสาย — เคส 7.2 ปกติ (รายงาน 644) จึงหลุดไป
    สาย 7.1 ตอนออกจากคณะอนุสนับสนุน (คืนเลขาฯ เป็น `005` แทน `104`, ขอข้อมูลเพิ่ม/ส่งคืนต้นทางก็เช่นกัน,
    stepper ผิดสาย) → เปลี่ยนเป็น `ECMIS.isCase72(kase)` (บั๊กเดิมก่อนงานนี้)
  - `approval-review.html` event log บันทึก from_status เป็นสถานะใหม่ (persistCase เปลี่ยน kase.status
    ก่อน log) ทั้งขั้นส่ง ผอ.กบค. และขั้นลงนามปกติ → จับ fromStatus ก่อน persist (บั๊กเดิมของขั้นลงนาม)
  - หน้า ผอ.กบค. นับงานค้างคณะเป็น ๐/๐ ทั้งที่มี 7 เรื่องเก่าไม่มีป้ายคณะ → แสดงจำนวน "ยังไม่ระบุคณะ" แยก
  - ชื่อหน้า inbox ของ ผอ.กบค. เปลี่ยนจาก "รายการรับรองเหตุผลเร่งด่วน" เป็น "รายการงาน ผอ.กบค."
- [x] `npm test` 5/5, `npm run test:integration` 60/60
- [x] แถวทดสอบ soft-delete แล้ว (`is_deleted=true` — DELETE ด้วย anon key ไม่มีผลจริง; แถวค้างจากรอบ
      2026-09-25..28 ก็ soft-delete แล้วด้วย)

### หมายเหตุสำคัญ: cache ของ dev server ระหว่างทดสอบ
เจอปัญหา `http-server`/SimpleHTTPServer แบบ python ที่ผู้ใช้รันเองไม่ส่ง cache header ที่เหมาะสม ทำให้
Browser pane cache ไฟล์ `assets/ecmis-app.js` เก่าค้างไว้แม้ hard-reload — ต้อง fetch ด้วย `cache:'no-store'`
แล้ว eval ทับ `window.ECMIS` เพื่อทดสอบโค้ดล่าสุดได้จริงระหว่างเซสชันนี้ ไม่ใช่บั๊กของโค้ดแอป แต่เป็น
quirk ของ dev server เอง — คนถัดไปที่ทดสอบควรรู้ไว้ถ้าเจออาการ "แก้โค้ดแล้วแต่ browser ไม่เห็นการเปลี่ยนแปลง"

---

## ❓ 7. ข้อตัดสินใจรอบ 2 (ผู้ใช้ตอบแล้ว 2026-09-28)

| # | เรื่อง | ข้อสรุป |
|---|---|---|
| Q-A | คณะในหน้าอนุสนับสนุน | **ล็อกตามที่ ผอ.กบค. เลือก** — อนุสนับสนุนเปลี่ยนเองไม่ได้ |
| Q-B | KPI ของเลขาฯ ระหว่างรอ ผอ.กบค. | นับรวม **การ์ดเดิมที่นับเคสส่งคณะอนุสนับสนุน** ไม่เพิ่มการ์ดใหม่ |
| Q-C | ผู้ทำใบบันทึกซับซ้อน | **เลขาธิการฯ** (เหตุผลจาก g1reason เรียน ผอ.กบค.) — ผอ.กบค. ประทับเลขทะเบียนคุม+คณะที่มอบหมายเป็นส่วนท้าย |
| Q-D | TRANSITIONS stale ของอนุสนับสนุน | **แก้ในงานนี้** ให้ `IN_SUPPORT_SUB[_72]` → `PENDING_SECGEN[_72]` ตรงกับการทำงานจริง |

---

## 🧪 8. Verification & Quality Gate Matrix
- [ ] Live walkthrough 7.1 + 7.2 ครบวง (secgen → dir_case → support_sub → secgen)
- [ ] เลขทะเบียนรันต่อเนื่องถูกต้อง (ทค.1 → ทค.2) และขึ้นบนเอกสาร/หน้าที่เกี่ยวข้อง
- [ ] DOCX ใบบันทึกซับซ้อนเปิดได้ รูปแบบ A4 ถูกต้อง
- [ ] เส้นทางไม่ซับซ้อน / เร่งด่วน ไม่ถดถอย
- [ ] `npm run sync` + `npm test` ผ่าน 5/5 ทุก Stage
- [ ] `npm run test:integration` (แตะ persistence)

---

## 🏁 9. Completion & Sign-off
- **Completed Date:** —
- **Commit Reference:** —
- **Notes:** —
