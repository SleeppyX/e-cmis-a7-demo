# 📋 Task Plan: หน้าจอประธานฯ — ขั้น "ลงนามมอบหมายส่งคณะอนุกลั่นกรองฯ" (เคสไม่ด่วน 7.1 + 7.2)

> **Plan ID:** `2026-09-08-chairman-assign-before-screening`
> **Date:** 2026-09-08
> **Author / Agent:** Claude Code
> **Status:** Draft (วางแผน — ยังไม่ implement)
> **Branch / PR:** `pre-main`

---

## 🎯 1. Problem Statement & Business Objective

- **ปัญหา (gap G-A จากการตรวจกับ NotebookLM):**
  ตาม Flow จริง (เล่ม 5 กิจกรรมที่ 7 — swimlane `593a2cd4` / `0948e951`, ยืนยันโดยบันทึกประชุมเก็บ requirement)
  **เคสไม่ด่วน** ประธานกรรมการ ป.ป.ท. ต้อง **"ลงนามในบันทึกมอบหมาย" ให้ส่งเรื่องเข้าคณะอนุกลั่นกรองฯ ก่อน**
  แล้วสำนวนจึงไปที่กองบริหารคดี → กระจายเข้าคณะที่ ๑–๘

  ระบบสาธิตปัจจุบัน **ไม่มีขั้นนี้จริง**:
  - **7.1:** มีสถานะ `PENDING_CHAIRMAN` อยู่ และมี transition `ORDER_SCREENING` (`PENDING_CHAIRMAN → IN_SCREENING`,
    actor chairman) นิยามไว้ใน spec **แต่ไม่มี UI ยิง** — `chairman-agenda.html` `save_status`
    hard-code ไป `AGENDA_SET` (ข้ามชั้นกลั่นกรอง)
  - **7.2:** **ไม่มี chairman node ก่อน `IN_SCREENING_72` เลย** — `approval-review.html` (secgen) เรียก
    `ECMIS.nextStates('PENDING_SECGEN_72', kase)` → แถว `SIGN_NORMAL_72` → `IN_SCREENING_72` ตรง

- **เป้าหมาย:** เพิ่มขั้น "ประธานลงนามมอบหมาย → ส่งคณะอนุกลั่นกรองฯ" สำหรับเคสไม่ด่วนทั้ง 7.1 และ 7.2
  ให้ flow เดินได้จริงใน demo (state ต่อเนื่อง → เข้าคิว กบค. `case-admin-inbox` → กระจายเข้าคณะ)

- **ขอบเขต (ตกลงกับผู้ใช้):**
  - ทำ **uniform** — เคสไม่ด่วนทุกเคส (7.1 + 7.2) ผ่านประธานลงนามมอบหมาย ไม่แยกตาม `ownerOrg` (กองปราบ/เขต)
    *(หมายเหตุ: NotebookLM ระบุว่าจริง ๆ ขั้นนี้มีเฉพาะสำนวนกองปราบ ส่วนสำนวนเขต กบค. ส่งตรง —
    บันทึกไว้เป็น gap ที่ยอมรับ เพื่อความง่ายของ demo)*
  - **ไม่รวม** signature point (b) "ประธานลงนามบรรจุวาระ หลังกลั่นกรองเสร็จ" — หลังกลั่นกรอง เคสไป
    `AGENDA_SET` (board_sec) ตามเดิม
  - **ไม่รวม** cap 40/คณะ (gap G-B) และ bypass "กลุ่มกิจการฯ กลั่นกรองแทน" (gap G-C) — งานแยก

- **ข้อกฎหมาย/มติ:** ม.๒๔ (คำสั่งแต่งตั้งคณะไต่สวน — เกิดหลังบอร์ดมีมติ ไม่เกี่ยวกับขั้นนี้);
  บันทึกมอบหมายขั้นนี้เป็น **บันทึกสั่งการภายใน** ให้ กบค. ส่งคณะอนุกลั่นกรองฯ

---

## 📂 2. Affected Routes & Modules

- [ ] Assets JS: `assets/ecmis-app.js`
  - STATUS: เพิ่ม `PENDING_CHAIRMAN_72`
  - STATUS_CODE: `PENDING_CHAIRMAN_72: '118'` (100–117 เต็มหมด, `118` ว่าง — ตรวจแล้ว)
  - TRANSITIONS: แก้ target ของ `SIGN_NORMAL_72` + `SUPPORT_DONE_72`; เพิ่ม 2 แถว chairman ใหม่;
    ยืนยัน `ORDER_SCREENING` (7.1) มีอยู่แล้ว
  - `PAGE_FOR_72`: `PENDING_CHAIRMAN_72 → 'chairman-agenda.html'`
  - `STATUS_STEP_72`: `PENDING_CHAIRMAN_72 → 'agenda72'` (กลุ่มเดียวกับ `IN_SCREENING_72`)
- [ ] Root HTML: `chairman-agenda.html` — โหมด "assign step" (doc บันทึกมอบหมาย + ปุ่ม)
- [ ] Root HTML: `inbox.html` — `isChairActionable` + KPI bucket + routing (เพิ่ม `PENDING_CHAIRMAN_72`)
- [ ] Mirror: `res/chairman-agenda.html`, `res/inbox.html` — ผ่าน `npm run sync`
- [ ] Docs: `CLAUDE.md` §4/§5 (ถ้าจำเป็น), ไฟล์แผนนี้
- [x] **ไม่ต้องแก้** `approval-review.html` — ใช้ `nextStates` + `PAGE_FOR_72` → auto-follow target ใหม่ (ยืนยันจาก approval-review.html:1569, 1583)
- [x] **ไม่ต้องแก้** `support-subcommittee.html` — `submit` เขียน `PENDING_SECGEN_72` (กลับ secgen) แล้ว secgen ค่อย route (ยืนยันจาก support-subcommittee.html:952)

---

## 🛡️ 3. The 6 Golden Anti-Regression Pre-Check

- [x] 1. ไม่กระทบคอลัมน์ "ประเภทเรื่อง"
- [x] 2. ไม่แตะ `PAGE_PERMISSIONS` / agenda-registry (chairman-agenda.html เปิดให้ chairman อยู่แล้ว)
- [x] 3. ไม่เรียก `supabase.createClient` ตรง — ใช้ helper/`persistCase`/`updateCaseStatus` เดิม
- [x] 4. รัน `npm run sync` หลังแก้ root (chairman-agenda.html, inbox.html)
- [x] 5. ไม่แตะ A4 geometry / `ecmis-app.css`
- [x] 6. ไม่ใช้ `--no-verify`

---

## 📝 4. Step-by-Step Implementation Tasks

### Task 1 — `assets/ecmis-app.js`: STATUS + STATUS_CODE
เพิ่มใน STATUS block (ใกล้ `PENDING_CHAIRMAN_URGENT_72` บรรทัด ~186):
```js
PENDING_CHAIRMAN_72: { label:'รอประธานฯ ลงนามมอบหมาย (ส่งคณะอนุกลั่นกรองฯ)', cls:'st-pending', owner:'chairman' },
```
STATUS_CODE: เพิ่ม `PENDING_CHAIRMAN_72:'118'`

### Task 2 — `assets/ecmis-app.js`: TRANSITIONS
**7.2 — เปลี่ยน target ให้แวะประธานก่อน:**
```js
// เดิม: { from:'PENDING_SECGEN_72', to:'IN_SCREENING_72', event:'SIGN_NORMAL_72', ... }
{ from:'PENDING_SECGEN_72', to:'PENDING_CHAIRMAN_72', event:'SIGN_NORMAL_72', actor:'secgen',
  ref:'เสนอประธานฯ ลงนามมอบหมายก่อนส่งกลั่นกรอง', guard:k => !k.complex72 && !k.urgent72 },
// เดิม: { from:'IN_SUPPORT_SUB_72', to:'IN_SCREENING_72', event:'SUPPORT_DONE_72', ... }
{ from:'IN_SUPPORT_SUB_72', to:'PENDING_CHAIRMAN_72', event:'SUPPORT_DONE_72', actor:'support_sub',
  ref:'เห็นชอบวาระปกติ — เสนอประธานฯ ลงนามมอบหมาย', guard:k => !k.urgent72 },
```
**7.2 — เพิ่ม 2 แถว chairman ใหม่ (หลัง `AGENDA_URGENT_72`):**
```js
{ from:'PENDING_CHAIRMAN_72', to:'IN_SCREENING_72', event:'ORDER_SCREENING_72', actor:'chairman',
  ref:'ประธานฯ ลงนามมอบหมาย — ส่งคณะอนุกลั่นกรองฯ (กบค. กระจายเข้าคณะที่ ๑–๘)' },
{ from:'PENDING_CHAIRMAN_72', to:'RETURNED_72', event:'CHAIRMAN_RETURN_72', actor:'chairman',
  ref:'ประธานฯ ตีกลับให้ผู้รับผิดชอบสำนวนแก้ไข' },
```
**7.1 — ไม่ต้องเพิ่ม:** `{ from:'PENDING_CHAIRMAN', to:'IN_SCREENING', event:'ORDER_SCREENING', actor:'chairman' }`
มีอยู่แล้ว (บรรทัด ~244). แถว `ORDER_AGENDA_URGENT` (`PENDING_CHAIRMAN → AGENDA_SET`, guard `urgentCertified`) คงไว้

### Task 3 — `assets/ecmis-app.js`: `PAGE_FOR_72` + `STATUS_STEP_72`
```js
// PAGE_FOR_72 — เพิ่มบรรทัดใกล้ PENDING_CHAIRMAN_URGENT_72
PENDING_CHAIRMAN_72:'chairman-agenda.html',
// STATUS_STEP_72 — เพิ่มในกลุ่ม agenda72
PENDING_CHAIRMAN_72:'agenda72',
```

### Task 4 — `chairman-agenda.html` (+res): โหมด "assign step"
`renderPage()` เดิมเช็ค `is72` เท่านั้น. เพิ่มการจำแนก:
```js
const isAssignStep = kase.status === 'PENDING_CHAIRMAN' || kase.status === 'PENDING_CHAIRMAN_72';
const is72 = ECMIS.isCase72(kase);
```
- **โหมด assign step** (`isAssignStep && !kase.urgentCertified`):
  - เอกสาร: A4 "บันทึกมอบหมายให้กองบริหารคดีส่งคณะอนุกรรมการกลั่นกรองฯ พิจารณา" (สั้น: เลขสำนวน,
    เรื่อง, ผู้รับผิดชอบ/สังกัด, ข้อความมอบหมาย, ช่องลงนามประธานฯ) — render ผ่าน pattern เดิม
    (`renderDoc()` แตกสาขา)
  - `buildButtons()` (สาขาใหม่):
    ```js
    [
      { act:'assign_screening', label:'ลงนามมอบหมาย → ส่งคณะอนุกลั่นกรองฯ', icon:'fa-signature', cls:'btn-gold' },
      { act:'return',           label:'ตีกลับให้ผู้รับผิดชอบสำนวนแก้ไข',      icon:'fa-rotate-left', cls:'btn-outline-danger' }
    ]
    ```
    (ถ้า `kase.urgentCertified` เป็น 7.1 → ใช้สาขาเดิม: ปุ่ม `save_status` "บันทึกคำสั่งและส่งบรรจุวาระ" → `AGENDA_SET`)
- **`handle('assign_screening')`** — ตามแพตเทิร์น G1:
  1. `ECMIS.signDialog('บันทึกมอบหมายส่งคณะอนุกลั่นกรองฯ — เรื่องที่ <id>', '<ชื่อ-ตำแหน่งประธานฯ>')`
  2. ยืนยัน → ฝังลายเซ็น + `ECMIS.Model.SignatureStore.create({docType:'บันทึกมอบหมายส่งคณะอนุกลั่นกรองฯ', signerRole:'chairman', ...})`
  3. `ECMIS.pushCaseHistory(kase, { from:kase.status, to:<IN_SCREENING|IN_SCREENING_72>, event:<ORDER_SCREENING|ORDER_SCREENING_72>, actor:'chairman', note:reason })`
  4. `await ECMIS.updateCaseStatus(kase, is72 ? 'IN_SCREENING_72' : 'IN_SCREENING', sb)` +
     `ECMIS.logRequestEvent(kase.trr_id, fromStatus, next, {type:'SIGNED', actorRole:'chairman'})` (ตามที่ `save_status` เดิมทำ)
  5. toast → redirect `inbox.html` (ประธานฯ ไม่มีสิทธิ์เข้า `case-admin-inbox.html` — RBAC guard เด้งกลับ)
- **`handle('return')`** — ใช้ handler เดิม แต่แก้สถานะ: `kase.status = is72 ? 'RETURNED_72' : 'RETURNED'`
  (เดิม hard-code `'RETURNED'` เสมอ — บั๊กเล็กที่แก้พร้อมกัน) + `pushCaseHistory`
- **หมายเหตุ:** เอกสาร ปปท.๕-๐๒ / ๗-๐๒ ที่ `chairman-agenda.html` เคย render สำหรับ `PENDING_CHAIRMAN`
  ย้ายไปเป็นของ **หลังบอร์ดมีมติ** (order.html / ruling-report.html มีอยู่แล้ว) — ขั้นนี้ไม่เกี่ยว

### Task 5 — `inbox.html` (+res): chairman queue
- `isChairActionable(c)` — เพิ่ม `|| c.status === 'PENDING_CHAIRMAN_72'`
- KPI bucket "รอสั่งการวาระปกติ" (`PENDING_NORMAL`, บรรทัด ~421) — เพิ่ม `|| (c.status === 'PENDING_CHAIRMAN_72')`
  (ตัวนับ + `applyFilters` + `row()` catBadge)
- routing block (บรรทัด ~641–648): `PENDING_CHAIRMAN_72` ตกลง `else` → `chairman-agenda.html?case=...` อยู่แล้ว
  — เพิ่ม comment ให้ชัด หรือใส่ explicit branch

### Task 6 — Sync + Docs
`npm run sync` · อัปเดต `CLAUDE.md` ถ้ามีการระบุ flow 7.1/7.2 ที่ขัดกับของใหม่

---

## 🧪 5. Verification & Quality Gate Matrix

### 5.1 Manual UI (role chairman, ต่อ Supabase จริง)
| # | ขั้นตอน | ผลที่คาดหวัง |
|---|---|---|
| V1 | 7.2 เคส non-urgent: secgen (`approval-review.html`) เห็นชอบ "เสนอเข้าการกลั่นกรองปกติ" | เคสไป `PENDING_CHAIRMAN_72` (ไม่ใช่ `IN_SCREENING_72`), redirect หน้า chairman-agenda ของเคส |
| V2 | login chairman → `inbox.html` | เคส `PENDING_CHAIRMAN_72` โผล่การ์ด "รอสั่งการวาระปกติ" + ปุ่ม "พิจารณาสั่งการ" |
| V3 | กด "พิจารณาสั่งการ" → `chairman-agenda.html` | เห็นเอกสาร "บันทึกมอบหมายส่งคณะอนุกลั่นกรองฯ" + 2 ปุ่ม (ลงนามมอบหมาย / ตีกลับ) |
| V4 | กด "ลงนามมอบหมาย → ส่งคณะอนุกลั่นกรองฯ" → signDialog → ยืนยัน | สถานะ `IN_SCREENING_72`, `subCommittee` ยังว่าง, history `ORDER_SCREENING_72`, Supabase `trr_status=108`, redirect inbox |
| V5 | login case_admin → `case-admin-inbox.html` | เคสโผล่การ์ด "รอส่งเข้าคณะ" (คิว กบค.) — จากนั้นกระจายเข้าคณะได้ตามปกติ |
| V6 | 7.1 เคส `PENDING_CHAIRMAN` non-urgent: chairman-agenda → กดปุ่มใหม่ | สถานะ `IN_SCREENING` (ไม่ใช่ `AGENDA_SET`), เข้าคิว กบค. |
| V7 | 7.1 เคส `PENDING_CHAIRMAN` + `urgentCertified` | ยังใช้สาขาเดิม → ปุ่ม "บันทึกคำสั่งและส่งบรรจุวาระ" → `AGENDA_SET` (ไม่กระทบ) |
| V8 | กด "ตีกลับให้แก้ไข" (7.2) | สถานะ `RETURNED_72` (ไม่ใช่ `RETURNED`), history `CHAIRMAN_RETURN_72` |
| V9 | เคสด่วน 7.2 (`PENDING_CHAIRMAN_URGENT_72`) | ยังไป `urgent-agenda.html` เหมือนเดิม 3 ปุ่ม G1 — ไม่กระทบ |
| V10 | Console ทุกหน้า | ไม่มี error / `PENDING_CHAIRMAN_72 undefined` |

### 5.2 Automated
- [ ] `npm run sync` (chairman-agenda.html, inbox.html → res/)
- [ ] `npm test` (5-Layer CI) ผ่าน 100%
  - Layer 1: `ecmis-app.js` parse
  - Layer 3: `PENDING_CHAIRMAN_72` ไม่ทำให้ลิงก์ 404 (routing เป็น JS `location.href`)
  - Layer 4: chairman ยังไม่ได้สิทธิ์ agenda-registry
- [ ] `npm run test:integration` (แตะ STATUS/persistence)

### 5.3 Anti-Regression เฉพาะจุด
- [ ] `approval-review.html` 7.2 non-complex non-urgent → `nextStates` คืน `PENDING_CHAIRMAN_72` + route `chairman-agenda.html`
- [ ] `approval-review.html` 7.2 **complex** (`SIGN_COMPLEX_72`) → ยังไป `IN_SUPPORT_SUB_72` เหมือนเดิม
- [ ] `approval-review.html` 7.2 **urgent** (`SIGN_URGENT_72`) → ยังไป `PENDING_URGENT_72` เหมือนเดิม
- [ ] `subcommittee-inbox` / `subcommittee-screening` — เคสที่ผ่านขั้นใหม่แล้วเข้า `IN_SCREENING_72` ปกติ
- [ ] stepper 72 (`ECMIS.stepperHtml`) แสดง `PENDING_CHAIRMAN_72` ในกลุ่ม `agenda72` ไม่พัง

---

## 🏁 6. Completion & Sign-off

- **Completed Date:** _(รอ implement)_
- **Commit Reference:** _(รอบนี้วางแผนอย่างเดียว)_
- **Notes / Retrospective:**
  - Blast radius แคบกว่าที่ประเมินตอนแรก: `approval-review.html` + `support-subcommittee.html`
    **ไม่ต้องแก้** เพราะ approval-review ใช้ `nextStates`(transitions-driven) และ support-sub เขียนกลับ `PENDING_SECGEN_72`
  - gap ที่ยังเหลือ (บันทึกไว้ ไม่ทำรอบนี้): (b) ประธานลงนามบรรจุวาระหลังกลั่นกรอง · G-B cap 40/คณะ ·
    G-C bypass "กลุ่มกิจการฯ" · แยก 2 เส้นทาง กองปราบ/เขต ตาม `ownerOrg`
