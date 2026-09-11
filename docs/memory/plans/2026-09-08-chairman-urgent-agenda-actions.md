# 📋 Task Plan: ประธานฯ — เพิ่ม 2 คำสั่งบนหน้าคำร้องขอบรรจุวาระด่วน (urgent-agenda.html)

> **Plan ID:** `2026-09-08-chairman-urgent-agenda-actions`
> **Date:** 2026-09-08
> **Author / Agent:** Claude Code
> **Status:** Verified (implemented + CI + browser test ผ่าน — ยังไม่ commit ตามคำสั่งผู้ใช้)
> **Branch / PR:** `main`

---

## 🎯 1. Problem Statement & Business Objective

- **ปัญหา / ความต้องการ:**
  หน้า `urgent-agenda.html` ที่สถานะ `PENDING_CHAIRMAN_URGENT_72` ปัจจุบันให้ประธานกรรมการ ป.ป.ท. ทำได้ทางเดียวคือ
  **"ลงนามมอบหมาย/บรรจุวาระด่วน"** (ปุ่ม `sign` → `PENDING_INVITE_72` ข้ามชั้นกลั่นกรอง) ทำให้ประธานฯ
  ในระบบสาธิตไม่มีทางปฏิเสธ fast-track ได้เลย

  ตามกระบวนการจริง (NotebookLM "E-CMIS" กิจกรรมที่ 7 — Use Case **RES004 / RES013** flow of events + alternative flow,
  ยืนยันด้วยบันทึกประชุม กจ.7 260604) เมื่อเรื่องด่วนเสนอถึงประธานฯ ประธานฯ ต้องเลือกได้ **3 ทาง**:
  1. อนุมัติบรรจุวาระบอร์ดทันที (ข้ามคณะอนุกรรมการกลั่นกรอง ชุด ๑–๘) — *มีอยู่แล้ว*
  2. เห็นว่า "ยังไม่เร่งด่วนจริง" / มีประเด็นต้องตรวจเพิ่ม → สั่งส่งเข้าคณะอนุกรรมการกลั่นกรองตามปกติ — **ยังไม่มี (Gap G1)**
  3. เห็นว่า "สำนวนยังไม่สมบูรณ์" → ตีกลับให้ผู้รับผิดชอบสำนวนแก้ไข — **ยังไม่มี (Gap G1)**

  แผนนี้ทำเฉพาะ **G1** (2 ปุ่มที่ยังขาด) — G2 (lead time หนังสือเชิญ ≥ 3 วัน / "วาระจร"),
  G3 (ชั้นเสนอก่อนถึงประธานฯ), G4 (ค่า SLA เรื่องด่วน 7 วัน) ไม่อยู่ในขอบเขตรอบนี้

- **ข้อกฎหมาย / มติที่เกี่ยวข้อง:**
  - พ.ร.บ. มาตรการของฝ่ายบริหารในการป้องกันและปราบปรามการทุจริต พ.ศ. ๒๕๕๑ — ม.๒๔ (แต่งตั้งคณะไต่สวน หลังบอร์ดมีมติ),
    ม.๑๘/๔ (ฐานรับเรื่องของเคสตัวอย่าง 1210/2566)
  - อำนาจประธานกรรมการ ป.ป.ท. ในการสั่งการ/คัดแยกความเร่งด่วน — RES004, RES013 (เล่ม 5 กิจกรรมที่ 7)
  - Key control: **ผอ.กบค. ต้องรับรองเหตุผลเร่งด่วนไว้ก่อน** (ทำแล้วที่สถานะ `PENDING_URGENT_72` ปุ่ม `certify`) —
    แผนนี้ไม่แตะขั้นนั้น
  - หลักการ "การยุติเรื่อง / ไม่รับไว้ไต่สวน เป็นมติที่ประชุมคณะกรรมการ ป.ป.ท. เท่านั้น" →
    **ไม่เพิ่มปุ่ม "ปฏิเสธ/ตีตก"** ให้ประธานฯ ใช้เดี่ยว

- **เคสอ้างอิงสำหรับทดสอบ:** `1210/2566` (7.2, `procType:'7.2'`, `docType:'RULING'`, `urgent72:true`,
  `status:'PENDING_CHAIRMAN_URGENT_72'`, ผอ.กบค. รับรองแล้ว `urgentCertifiedDate72:'20 ก.ค. 2569'`)

---

## 📂 2. Affected Routes & Modules

- [ ] Root HTML: `urgent-agenda.html` — `buildButtons()` (สาขา `isSignStep`) + `handle(act)` (เพิ่ม 2 `else if`)
- [ ] Mirror HTML: `res/urgent-agenda.html` — ผ่าน `npm run sync` (ห้ามแก้มือ)
- [ ] Assets JS: `assets/ecmis-app.js` — เพิ่ม 2 แถวใน `TRANSITIONS` (documentation/consistency)
- [ ] Assets CSS: ไม่แตะ
- [ ] Scripts / CI: ไม่แตะ

**ยืนยันจากการสำรวจโค้ด:**
- `STATUS['IN_SCREENING_72']` (owner `subcommittee`, code `108`) และ `STATUS['RETURNED_72']` (owner `owner`, code `103`)
  **มีอยู่แล้ว** — ไม่ต้องเพิ่ม status key ใหม่ / ไม่ต้องแตะ `STATUS_CODE`
- `TRANSITIONS` มีแถวจาก `PENDING_CHAIRMAN_URGENT_72` แค่แถวเดียว (`AGENDA_URGENT_72 → PENDING_INVITE_72`, บรรทัด ~320)
  — ยังไม่มีแถวไป `IN_SCREENING_72` และ `RETURNED_72`
- `canAct()` — owner ของ `PENDING_CHAIRMAN_URGENT_72` คือ `chairman` อยู่แล้ว → 2 ปุ่มใหม่ผ่าน gate เดียวกับปุ่ม `sign`
  ไม่ต้องใช้ `opts.forceAllowed`
- `ECMIS.actionBar()` อ่าน button object เฉพาะ `{ act, label, icon, cls }` — ไม่มี `onClick`/`id`
  (dispatch ผ่าน `handle(b.dataset.act)` เดิม)

---

## 🛡️ 3. The 6 Golden Anti-Regression Pre-Check

- [x] 1. ไม่กระทบคอลัมน์ "ประเภทเรื่อง" — ไม่แตะ `inbox.html` / `resolution-inbox.html`
- [x] 2. ไม่เปิดสิทธิ์ `agenda-registry.html` ให้ Chairman/Affairs — ไม่แตะ `PAGE_PERMISSIONS`
- [x] 3. เรียก Supabase ผ่าน `ECMIS.getSupabaseClient()` เท่านั้น — ใช้ `persistCase()` เดิม (มี fallback pattern
      `urgent-agenda.html:125` ที่ CI layer 4 ต้องเจอทั้ง `supabase.createClient(` และ `ECMIS.getSupabaseClient` → คงบรรทัดนี้ไว้)
- [x] 4. รัน `npm run sync` หลังแก้ Root — อยู่ใน Phase 3 ของแผนนี้
- [x] 5. ไม่แตะระยะขอบ A4 สารบรรณ — ไม่แตะ `ecmis-app.css` / `.doc-paper`
- [x] 6. ไม่ใช้ `--no-verify` — รอบนี้ไม่ commit; รอบถัด commit ปกติผ่าน hook

---

## 📝 4. Step-by-Step Implementation Tasks

### Task 1 — `assets/ecmis-app.js`: เพิ่ม 2 แถว `TRANSITIONS`
แทรกหลังแถว `AGENDA_URGENT_72` (บรรทัด ~320) เพื่อความสอดคล้อง (แถวนี้เป็นตารางอ้างอิง หน้าไม่ได้ consult จริง
แต่ทีม/AI ตัวถัดไปใช้อ่าน flow):
```js
{ from:'PENDING_CHAIRMAN_URGENT_72', to:'IN_SCREENING_72', event:'URGENT_REJECT_72', actor:'chairman',
  ref:'ประธานฯ เห็นว่ายังไม่ด่วนจริง — ส่งเข้าคณะอนุกลั่นกรองฯ',
  note:'ไม่บรรจุวาระด่วน — เข้าเส้นทางกลั่นกรองปกติ (กบค. กระจายเข้าคณะที่ ๑–๘)' },
{ from:'PENDING_CHAIRMAN_URGENT_72', to:'RETURNED_72', event:'URGENT_RETURN_OWNER_72', actor:'chairman',
  ref:'ประธานฯ ตีกลับให้ผู้รับผิดชอบสำนวนแก้ไข',
  note:'ส่งคืนเจ้าของสำนวน (RETURNED_72 owner=owner) — แก้ไขแล้วเสนอกลับตามสาย' },
```
เกณฑ์: `node -c` ผ่าน (CI layer 1)

### Task 2 — `urgent-agenda.html`: `buildButtons()` สาขา `isSignStep`
เปลี่ยนจากคืน 1 ปุ่ม เป็นคืน 3 ปุ่ม (เรียงตามลำดับความ "แนะนำ"):
```js
if (isSignStep) {
  return [
    { act: 'sign',           label: 'ลงนามมอบหมาย/บรรจุวาระด่วน',        icon: 'fa-signature', cls: 'btn-gold' },
    { act: 'sendScreening',  label: 'ส่งเข้าคณะอนุกลั่นกรองฯ (ยังไม่ด่วนจริง)', icon: 'fa-people-arrows', cls: 'btn-navy' },
    { act: 'returnOwner',    label: 'ตีกลับให้ผู้รับผิดชอบสำนวนแก้ไข',       icon: 'fa-rotate-left', cls: 'btn-outline-danger' },
  ];
}
```
- ป้ายชื่อ/ไอคอน/สี ปรับได้ตอน implement ให้เข้ากับชุด class เดิมของหน้า (`btn-gold` / `btn-navy` ใช้อยู่แล้ว)

### Task 3 — `urgent-agenda.html`: เพิ่ม input เหตุผลสำหรับ 2 action ใหม่
- ในการ์ดขั้นตอน (`isSignStep`) เพิ่ม `<textarea id="chairUrgentNote">` (ซ่อนไว้ default) + ป้ายกำกับ
  "เหตุผลของประธานฯ (บังคับกรอกเมื่อส่งกลั่นกรอง / ตีกลับ)"
- หรือใช้ `ECMIS.confirmAction({ input:'textarea', inputValidator })` แบบ inline ใน handler ก็ได้
  (แล้วแต่ความสม่ำเสมอกับ `signDialog` — ตัดสินตอน implement) — **ข้อกำหนด: ต้องบังคับกรอก ไม่ว่างเท่านั้นจึงดำเนินการ**

### Task 4 — `urgent-agenda.html`: `handle(act)` เพิ่มสาขา `sendScreening`
ตามแพตเทิร์น `certify`/`sign` เดิม:
1. อ่านเหตุผล → ถ้าว่าง `ECMIS.toastWarn(...)` + inline error → `return`
2. `ECMIS.confirmAction({ title:'ส่งเข้าคณะอนุกลั่นกรองฯ', html:'สำนวน &lt;id&gt; จะไม่บรรจุวาระด่วน และถูกส่งให้กองบริหารคดีกระจายเข้าคณะที่ ๑–๘', confirmText:'ยืนยันส่งกลั่นกรอง' })`
3. เมื่อ confirm:
   ```js
   ECMIS.pushCaseHistory(kase, {
     from: kase.status, to: 'IN_SCREENING_72', event: 'URGENT_REJECT_72',
     actor: 'chairman', note: reason
   });
   await persistCase(kase, {
     status: 'IN_SCREENING_72',
     urgentRejectNote: reason,
     urgentRejectedDate72: new Date().toISOString().slice(0,10)
     // ❗ ต้องไม่เซ็ต subCommittee — ปล่อยว่างเพื่อให้เข้าคิว "รอส่งเข้าคณะ" ของ case_admin
   });
   ```
4. `ECMIS.toastOk('ส่งเข้าคณะอนุกลั่นกรองฯ แล้ว — รอกองบริหารคดีกระจายสำนวน')`
5. `setTimeout(() => location.reload(), 1400)` — **แก้จากแผนเดิม**: redirect ไป `case-admin-inbox.html`
   ไม่ได้เพราะ role `chairman` ไม่มีสิทธิ์เข้าหน้านั้น (RBAC page guard เด้งกลับ `inbox.html` พร้อม toast)
   → ใช้ `location.reload()` แทน; สถานะใหม่หน้านี้จะโชว์กล่อง "ไม่อยู่ในขั้นตอน…" เป็นสัญญาณว่าสำนวนเดินต่อแล้ว
6. **สำคัญ**: patch ต้องมี `history: kase.history` ด้วย เพราะ `kase` มาจาก `loadCaseFromSupabase` (คนละ object
   กับ entry ใน `ECMIS.CASES`) — `persistCase` ทำ `Object.assign(memCase, patch)` จึงต้องส่ง history เข้าไปใน patch
   เพื่อให้ audit trail propagate ไป localStorage (แพตเทิร์นเดียวกับ `case-admin-detail.html:214`)

**เหตุผลของทิศทางนี้** (ยืนยันจากโค้ด): `isCaseAdminQueue(kase)` = `['IN_SCREENING','IN_SCREENING_72'].includes(status) && !kase.subCommittee`
→ เคสจะโผล่การ์ด "รอส่งเข้าคณะ" (default) ของ `case-admin-inbox.html` ทันที; `case_admin` เลือกคณะที่
`case-admin-detail.html` (modal → `nextSubcommitteeTeam()` round-robin → เขียน `kase.subCommittee` +
`pushCaseHistory('ROUTE_TO_SUBCOMMITTEE')`) — ตรงกับ flow จริง (ประธานฯ สั่ง / กบค. เดินสำนวน)

### Task 5 — `urgent-agenda.html`: `handle(act)` เพิ่มสาขา `returnOwner`
1. อ่านเหตุผล → บังคับไม่ว่าง (เหมือน Task 4)
2. `ECMIS.confirmAction({ title:'ตีกลับให้ผู้รับผิดชอบสำนวนแก้ไข', html:'สำนวน &lt;id&gt; จะถูกส่งคืนเจ้าของสำนวนเพื่อแก้ไข แล้วเสนอกลับตามสาย', confirmText:'ยืนยันตีกลับ' })`
3. เมื่อ confirm:
   ```js
   ECMIS.pushCaseHistory(kase, {
     from: kase.status, to: 'RETURNED_72', event: 'URGENT_RETURN_OWNER_72',
     actor: 'chairman', note: reason
   });
   await persistCase(kase, {
     status: 'RETURNED_72',
     urgentReturnNote: reason,
     urgentReturnedDate72: new Date().toISOString().slice(0,10)
   });
   ```
4. `ECMIS.toastOk('ตีกลับให้ผู้รับผิดชอบสำนวนแก้ไขแล้ว')`
5. `setTimeout(() => location.reload(), 1400)` — เคสสถานะ `RETURNED_72` route map ชี้ `approval-review.html`
   (เจ้าของสำนวนทำต่อที่นั่น: `RESUBMIT_72 → PENDING_SECTION_72` หรือ `SCREENING_RESUBMIT_72 → IN_SCREENING_72`)

### Task 6 — หมายเหตุการ persist
- `persistCase()` เขียน Supabase เฉพาะ `trr_status` (map ผ่าน `STATUS_CODE`: `108` / `103`) — ฟิลด์
  `urgentRejectNote` / `urgentReturnNote` / `*Date72` เป็น memory + `saveCases()` (localStorage) เท่านั้น
  (สอดคล้องกับ `urgentReason` / `urgentCertifiedDate72` เดิม — คอมเมนต์ `urgent-agenda.html:138-140`)
- `certify`/`sign` เดิม **ไม่** เรียก `pushCaseHistory` — 2 action ใหม่ให้เรียก (ตกลงกันแล้ว: ต้องมี audit trail
  เพื่อ demo ต่อเนื่อง — `case-admin-inbox`/`subcommittee` เห็นเหตุผลที่ประธานฯ ส่งมา)

### Task 7 — Sync
`npm run sync` → ตรวจว่า `res/urgent-agenda.html` อัปเดตตาม (asset path rewrite `assets/` → `../assets/` เท่านั้น;
ลิงก์ใน JES string เหมือนกันทั้ง 2 ฝั่ง)

---

## 🧪 5. Verification & Quality Gate Matrix

### 5.1 Manual UI Walkthrough (เบราว์เซอร์ + เคส 1210/2566, role chairman)
| # | ขั้นตอน | ผลที่คาดหวัง |
|---|---|---|
| V1 | เปิด `urgent-agenda.html?case=1210%2F2566` | เห็น 3 ปุ่ม: ลงนามบรรจุวาระด่วน / ส่งเข้าคณะอนุกลั่นกรองฯ / ตีกลับให้แก้ไข |
| V2 | กด "ส่งเข้าคณะอนุกลั่นกรองฯ" โดยไม่กรอกเหตุผล | เตือน "กรุณาระบุเหตุผล" ไม่ดำเนินการ |
| V3 | กรอกเหตุผล → ยืนยัน | toast สำเร็จ → ไป `case-admin-inbox.html`; เคส 1210/2566 อยู่การ์ด "รอส่งเข้าคณะ" (`IN_SCREENING_72`, `subCommittee` ว่าง) |
| V4 | login `case_admin` → เปิด `case-admin-detail.html` ของ 1210/2566 → "ส่งเข้าคณะ" | เขียน `subCommittee = คณะที่ N` → เคสโผล่ `subcommittee-inbox` ของคณะนั้น; history มี URGENT_REJECT_72 + ROUTE_TO_SUBCOMMITTEE |
| V5 | reset เคสกลับ `PENDING_CHAIRMAN_URGENT_72` → กด "ตีกลับให้แก้ไข" + เหตุผล → ยืนยัน | toast สำเร็จ; สถานะ `RETURNED_72`; reload แล้วหน้าแสดงกล่อง "ไม่อยู่ในขั้นตอน…" (owner=owner) |
| V6 | login เจ้าของสำนวน/affairs → `approval-review.html?case=1210/2566` | เคสอยู่คิวตีกลับ พร้อมเหตุผลของประธานฯ; เสนอกลับได้ |
| V7 | reset → กด "ลงนามบรรจุวาระด่วน" (ทางเดิม) | ยังทำงานเหมือนเดิม → `PENDING_INVITE_72` → `agenda.html` |
| V8 | เปิดหน้าด้วย role อื่น (affairs) | เห็นเฉพาะกล่อง "ไม่มีสิทธิ์ดำเนินการ" — ไม่มี 3 ปุ่มนี้ |
| V9 | Console | ไม่มี error/exception ใหม่ |

> reset สถานะระหว่างทดสอบ: แก้ `ECMIS.CASES` ใน console หรือ `sessionStorage`/`localStorage` (`ecmis.cases…`) แล้ว reload

### 5.2 Automated Gate
- [ ] `npm run sync` — `res/urgent-agenda.html` ตรงกับ root
- [ ] `npm test` (5-Layer CI) ผ่าน 100% (0 error / 0 warning)
  - Layer 1: `ecmis-app.js` parse ผ่าน
  - Layer 2: `res/urgent-agenda.html` มีอยู่
  - Layer 3: ไม่มีลิงก์ 404 (handler ใช้ `location.href` — ไม่ถูก scan; แต่ตรวจว่าไม่เผลอใส่ `<a href>` เสีย)
  - Layer 4: `urgent-agenda.html:125` ยังมีทั้ง `supabase.createClient(` + `ECMIS.getSupabaseClient`
  - Layer 5: ไม่แตะ A4
- [ ] `npm run test:integration` (แตะ state/persistence) — รันเพื่อความมั่นใจ

### 5.3 Anti-Regression เฉพาะจุด
- [ ] ปุ่ม `sign` เดิม + handler + `signDialog` + `SignatureStore` ไม่เปลี่ยนพฤติกรรม
- [ ] ปุ่ม `certify` (role `dir_case`, สถานะ `PENDING_URGENT_72`) ไม่กระทบ
- [ ] `persistCase()` signature เดิม (ยังรับ `{status, ...extra}`)
- [ ] เครื่องมือเอกสาร (edit/DOCX/print/zoom) ทำงานปกติ

---

## 🏁 6. Completion & Sign-off

- **Completed Date:** 2026-09-08 (implement + verify; ยังไม่ commit)
- **Commit Reference:** _(ยังไม่ commit ตามคำสั่งผู้ใช้)_
- **ไฟล์ที่แก้จริง:**
  - `assets/ecmis-app.js` — เพิ่ม 2 แถว `TRANSITIONS` (`URGENT_REJECT_72`, `URGENT_RETURN_OWNER_72`) หลัง `AGENDA_URGENT_72`
  - `urgent-agenda.html` — `renderStepCard()` สาขา `isSignStep` เพิ่ม `<textarea id="chairUrgentNote">` + val-msg;
    `buildButtons()` คืน 3 ปุ่ม; `handle(act)` เพิ่มบล็อก `sendScreening || returnOwner`
  - `res/urgent-agenda.html` — ผ่าน `npm run sync`
- **ผลทดสอบ:**
  - `npm run sync` ✅ (urgent-agenda.html → res/ 1 ไฟล์)
  - `npm test` (5-Layer CI) ✅ Errors: 0, Warnings: 0
  - Browser (เคส 1210/2566, role chairman, ต่อ Supabase จริง — reset trr_status กลับ 107 หลังทดสอบ):
    - V1 เห็น 3 ปุ่ม + textarea "ความเห็น/เหตุผลของประธานฯ" ✅
    - V2 กดโดยไม่กรอกเหตุผล → textarea แดง + val-msg + toast เตือน ✅
    - V3 "ส่งเข้าคณะฯ" + เหตุผล → confirm → `IN_SCREENING_72`, `subCommittee=null`, Supabase `trr_status=108`,
      `urgentRejectNote` + history `URGENT_REJECT_72` บันทึก, reload แสดง "ไม่อยู่ในขั้นตอน…" ✅
    - V4 login `case_admin` → `case-admin-inbox.html` เคส 1210/2566 โผล่การ์ด "รอส่งเข้าคณะ" พร้อมปุ่ม "ส่งเข้าคณะ" ✅
    - V5 "ตีกลับให้แก้ไข" + เหตุผล → confirm → `RETURNED_72`, Supabase `trr_status=103`,
      `urgentReturnNote` + history `URGENT_RETURN_OWNER_72` บันทึก, reload แสดง "ไม่อยู่ในขั้นตอน…" ไม่มีปุ่ม ✅
    - Console ไม่มี error ใหม่ ✅
  - **ยังไม่ทดสอบ**: V6 (owner ทำต่อที่ `approval-review.html`) / V7 (ปุ่ม `sign` เดิม) / V8 (role อื่นเห็นกล่อง
    ไม่มีสิทธิ์) — โค้ดไม่แตะ path เหล่านั้น ทำงานเหมือนเดิม แต่ควรตรวจซ้ำก่อน commit
- **Notes / Retrospective:**
  - แผนนี้ทำ **G1 เท่านั้น**; G2/G3/G4 (ดู `AI file/chairman-urgent-agenda-1210-2566.html` §5) เปิดเป็นงานแยก
  - ไม่เพิ่มปุ่ม "ปฏิเสธ/ตีตก" ให้ประธานฯ โดยเจตนา — การยุติเรื่องเป็นมติบอร์ดเท่านั้น
  - `TRANSITIONS` เป็นตารางอ้างอิง หน้าไม่ consult — behavior มาจาก handler ที่ hard-code target status
