# 📋 Task Plan: ประธาน ป.ป.ท. ลงนาม "สั่งบรรจุวาระ" หลังคณะอนุกลั่นกรองฯ พิจารณาเสร็จ (7.2 วินิจฉัยชี้มูล)

> **Plan ID:** `2026-09-09-chairman-sign-agenda-72`
> **Date:** 2026-09-09
> **Author / Agent:** Claude Code (grill-me 7 รอบ + NotebookLM E-CMIS 8 queries)
> **Status:** Draft (วางแผน — ยังไม่ implement, รออนุมัติ)
> **Branch:** `pre-main`
> **ต่อยอดจาก:** `2026-09-08-chairman-assign-before-screening` (`PENDING_CHAIRMAN_72` = ลายเซ็นประธานที่ 1)

---

## 🧭 0. Reference — Flow 7.2 วินิจฉัยชี้มูล ฉบับสมบูรณ์ (NotebookLM: เล่ม 5 / บันทึกประชุม 11e7f36a·cd9aa0f3·ebf3b09a / spec 7.1.2 / แผนผัง AS-IS 593a2cd4)

| # | ขั้น | ผู้ทำ | สถานะระบบ (ปัจจุบัน) |
| :-- | :-- | :-- | :-- |
| 1 | เสนอรายงานการไต่สวนเพื่อวินิจฉัยชี้มูล (รายงาน 644) | นักสืบ/คณะพนักงานไต่สวน | `SUBMIT_RULING_REPORT` → `PENDING_SECTION_72` |
| 2 | พิจารณาตามลำดับชั้น → **เลขาธิการ ป.ป.ท. ลงนาม + ให้ความเห็น + ตัดสิน ยุ่งยาก/ไม่ + ด่วน/ไม่** | ผอ.กอง/เขต → รอง/ผู้ช่วยเลขาฯ → **เลขาธิการ ป.ป.ท.** | `PENDING_SECGEN_72` (approval-review.html) — **triage อยู่ที่เลขาฯ** |
| 2b | *(ยุ่งยากเท่านั้น)* คณะอนุสนับสนุนเลขาฯ (2 คณะ) กลั่นกรอง+ทำความเห็น → **กลับมาเลขาฯ ลงนามขั้นสุดท้าย** | support_sub → secgen | `IN_SUPPORT_SUB_72` → *(ตอนนี้ข้ามกลับเลขาฯ)* → `PENDING_CHAIRMAN_72` |
| 3 | เส้นทางเอกสารก่อนถึงประธาน — กองปราบทำบันทึกเสนอนำเรียนเอง / เขต กบค.(บริหารคดีฯ) ลงรับ+สแกน | เจ้าของสำนวน / case_admin | *(ไม่ modeled — กองปราบ/เขตเป็นภายนอก ส่งเรื่องเข้าระบบเรา)* |
| 4 | **ประธาน ป.ป.ท. ลงนามมอบหมาย** (บันทึกเสนอนำเรียน / บันทึกจำแนกคัดกรอง) | chairman | `PENDING_CHAIRMAN_72` → `ORDER_SCREENING_72` → `IN_SCREENING_72` — **ลายเซ็นที่ 1 (มีแล้ว)** |
| 5 | ส่งเข้า **คณะอนุกรรมการกลั่นกรองเรื่องไต่สวนข้อเท็จจริง คณะที่ 1–8** | case_admin (บริหารคดีฯ) กระจายเข้าคณะ | `IN_SCREENING_72` (case-admin-inbox "ส่งเข้าคณะ" + subcommittee-screening) — **มีแล้ว** |
| 6 | อนุกลั่นกรองฯ พิจารณา + จัดทำ "บันทึกมติ/ความเห็น" + "หนังสือนำส่งมติพร้อมสำนวน" นำเรียนประธานฯ | คณะอนุฯ 1–8 | `SCREEN_DONE_72` |
| **7** | **ประธาน ป.ป.ท. ลงนามสั่งบรรจุวาระ** ← **ลายเซ็นที่ 2 — ยังไม่มี (นี่คือ G3 / งานรอบนี้)** | chairman | *(ปัจจุบัน `SCREEN_DONE_72` → `PENDING_INVITE_72` ตรง ข้ามลายเซ็นนี้)* |
| 8 | จัดทำระเบียบวาระ (วาระที่ ๕) + หนังสือเชิญประชุม + นัดหมายนักสืบ | กลุ่มงานคำวินิจฉัยและมติฯ = `board_sec` | `PENDING_INVITE_72` (agenda-registry.html) — มีแล้ว |
| 9 | บอร์ดใหญ่ ป.ป.ท. ลงมติ (นักสืบเจ้าของสำนวนชี้แจงเอง) | คณะกรรมการ ป.ป.ท. | `OPEN_MEETING_72` → `IN_MEETING_72` → ... — มีแล้ว |

**ข้อยกเว้น:** เร่งด่วน (ใบด่วน ผ่าน ผอ.กบค. + เลขาฯ) → ประธานลงนามบรรจุวาระด่วน **ข้ามคณะ 1–8** → กลุ่มงานคำวินิจฉัยฯ. *(`PENDING_CHAIRMAN_URGENT_72` → `AGENDA_URGENT_72` → `PENDING_INVITE_72` — มีแล้ว, **G3 ไม่แตะสายนี้**)*

**Role map ยืนยันจาก NotebookLM:** บริหารคดีและบริหารทั่วไป = `case_admin` · คำวินิจฉัยและมติคณะกรรมการ = `board_sec` · กิจการคณะกรรมการ = `affairs` (ทำคำสั่งแต่งตั้งอนุกรรมการ/คณะพนักงานไต่สวน **หลังบอร์ดมีมติ** — ไม่ใช่ intake)

---

## 🎯 1. Problem Statement & Business Objective

- **ปัญหา (gap G3):** ตาม NotebookLM หลังคณะอนุกลั่นกรองฯ คณะ 1–8 พิจารณาเสร็จ ต้องเสนอ **บันทึกความเห็น/มติของคณะอนุกลั่นกรองฯ นำเรียนประธานกรรมการ ป.ป.ท.** และ **ประธานฯ ลงนามสั่งบรรจุวาระ** ก่อนเรื่องจึงไปถึงกลุ่มงานคำวินิจฉัยฯ จัดทำระเบียบวาระ.
  ระบบสาธิตปัจจุบัน: `subcommittee-screening.html` กด "บันทึกเพื่อส่งมติ" → `SCREEN_DONE_72` → `PENDING_INVITE_72` ตรง (board_sec) — **ข้ามลายเซ็นประธานที่ 2 ทั้งหมด**
- **เป้าหมาย:** แทรกสถานะ `PENDING_SIGN_AGENDA_72` (ประธานลงนามสั่งบรรจุวาระ) คั่นระหว่าง `IN_SCREENING_72` กับ `PENDING_INVITE_72` สำหรับสาย 7.2 ที่ผ่านคณะอนุกลั่นกรองฯ (ทั้งเคสยุ่งยากและไม่ยุ่งยาก) — **ยกเว้นสายเร่งด่วน**
- **ขอบเขต (ตกลงกับผู้ใช้ grill-me 7 รอบ):**
  - ยึด **NotebookLM** เป็นหลัก (คำอธิบาย /grill-me เดิม 3 จุดที่ขัด — "ไม่ยุ่งยากข้ามอนุกลั่นกรอง", "affairs ทำ intake", "ขั้นประธานเฉพาะไม่ยุ่งยาก" — **ไม่ถูก**, ทิ้ง)
  - ทำ **เฉพาะ G3** รอบนี้
  - **จากอนุกลั่นกรอง → ประธานตรง** (ไม่เพิ่มสถานะ affairs/case_admin รวบรวมความเห็นคั่น เพื่อความง่าย demo — เอกสารมติที่อนุกลั่นกรองทำไว้แล้วใช้ได้)
  - reuse `chairman-agenda.html` + สาขาใหม่ (ไม่สร้างหน้าใหม่)
  - เอกสาร: **แม่แบบใหม่** house-style "บันทึกความเห็นคณะอนุกลั่นกรองฯ นำเรียนประธานฯ"
  - 2 ปุ่ม: **ลงนามสั่งบรรจุวาระ** (→ `PENDING_INVITE_72`) · **ตีกลับ** (→ `IN_SCREENING_72`)
  - ตีกลับ → `subcommittee-screening.html` **ปลดล็อคอัตโนมัติ** (status-driven ผ่าน `subScreeningStatus`), คณะอนุฯ แก้มติเดิมได้ (subOutcome/subOpinion คงอยู่), เห็น banner เหตุตีกลับของประธาน
  - KPI ประธานใน `inbox.html`: **การ์ดใหม่ "รอลงนามบรรจุวาระ"** (แยกจาก "รอสั่งการวาระปกติ")
  - **G1** (กองปราบ/เขต ต่างเส้นทาง) · **G2** (กลับเลขาฯ หลังอนุสนับสนุน + shortcut เห็นสอดคล้อง) — **บันทึกเป็น deferred gap ไม่ทำรอบนี้**

- **ข้อกฎหมาย/บริบท:** มติวินิจฉัยชี้มูล ม.๗๒ พ.ร.ป. ป.ป.ช. ๒๕๖๑ (เกิดที่บอร์ด ไม่เกี่ยวขั้นนี้); การลงนามสั่งบรรจุวาระเป็นอำนาจประธานฯ ตามระเบียบการประชุมคณะกรรมการ ป.ป.ท.

---

## 📂 2. Affected Routes & Modules

- [ ] `assets/ecmis-app.js`
  - STATUS: เพิ่ม `PENDING_SIGN_AGENDA_72`
  - STATUS_CODE: `PENDING_SIGN_AGENDA_72:'119'` (118 = PENDING_CHAIRMAN_72, 119 ว่าง — ตรวจแล้ว `ecmis-app.js:214-215`)
  - TRANSITIONS: แก้ target ของ `SCREEN_DONE_72` (`ecmis-app.js:338`) `PENDING_INVITE_72` → `PENDING_SIGN_AGENDA_72`; เพิ่ม 2 แถว chairman: `SIGN_AGENDA_72` (`PENDING_SIGN_AGENDA_72 → PENDING_INVITE_72`), `CHAIRMAN_RETURN_SCREENING_72` (`PENDING_SIGN_AGENDA_72 → IN_SCREENING_72`)
  - `PAGE_FOR_72`: `PENDING_SIGN_AGENDA_72 → 'chairman-agenda.html'`
  - `STATUS_STEP_72`: `PENDING_SIGN_AGENDA_72 → 'agenda72'` (`ecmis-app.js:2721` กลุ่มเดียวกับ IN_SCREENING_72)
  - `ACT7_STAGE_72`: `PENDING_SIGN_AGENDA_72 → 1`
- [ ] `chairman-agenda.html` (+`res/`) — สาขาใหม่ `isDocketSignStep()` = `status === 'PENDING_SIGN_AGENDA_72'`; renderDoc สาขาใหม่ (บันทึกความเห็นอนุกลั่นกรองฯ); buildButtons `[sign_agenda, return_screening]`; handle 2 action ใหม่
- [ ] `inbox.html` (+`res/`) — `isChairActionable` += `PENDING_SIGN_AGENDA_72`; KPI การ์ดใหม่ `PENDING_SIGN_AGENDA` "รอลงนามบรรจุวาระ" (counter + filter option + applyFilters match + row catBadge); routing block → `chairman-agenda.html`
- [ ] `subcommittee-screening.html` (+`res/`) — banner เหตุตีกลับของประธาน เมื่อ `kase.chairmanReturnReason72` มีค่า และ status = `IN_SCREENING_72`; ล้าง `chairmanReturnReason72` เมื่อกด SCREEN_DONE_72 ใหม่. Lock ปลดเองแล้ว (`subScreeningStatus` คืน `PENDING` เมื่อ status IN_SCREENING_72 — `ecmis-app.js:425-438`) — **ไม่ต้องแก้ logic lock**
- [ ] Docs: `CLAUDE.md` §4/§5 (ถ้า flow text ขัด) · plan นี้

- [x] **ไม่ต้องแก้** `agenda-registry.html` — ยังรับ `PENDING_INVITE_72` เหมือนเดิม (แค่มาถึงช้าลง 1 ขั้น)
- [x] **ไม่ต้องแก้** สายเร่งด่วน (`urgent-agenda.html` / `AGENDA_URGENT_72`) — ข้ามคณะ 1–8 จึงไม่มี `SCREEN_DONE_72` ไม่แตะ `PENDING_SIGN_AGENDA_72`

---

## 🛡️ 3. The 6 Golden Anti-Regression Pre-Check

- [x] 1. ไม่กระทบคอลัมน์ "ประเภทเรื่อง"
- [x] 2. ไม่แตะ `PAGE_PERMISSIONS` / agenda-registry (chairman-agenda เปิดให้ chairman อยู่แล้ว)
- [x] 3. ไม่เรียก `supabase.createClient` ตรง — ใช้ `updateCaseStatus`/`persistCase`/helper เดิม
- [x] 4. รัน `npm run sync` หลังแก้ root (chairman-agenda.html, inbox.html, subcommittee-screening.html)
- [x] 5. ไม่แตะ A4 geometry / `ecmis-app.css`
- [x] 6. ไม่ใช้ `--no-verify`

---

## 📝 4. Step-by-Step Implementation Tasks

### Task 1 — `assets/ecmis-app.js`: STATUS + STATUS_CODE
```js
// STATUS block (ใกล้ PENDING_CHAIRMAN_72)
PENDING_SIGN_AGENDA_72: { label:'รอประธานฯ ลงนามสั่งบรรจุวาระ (วินิจฉัยชี้มูล)', cls:'st-pending', owner:'chairman' },
// STATUS_CODE
PENDING_SIGN_AGENDA_72:'119'
```

### Task 2 — `assets/ecmis-app.js`: TRANSITIONS
```js
// แก้ target: SCREEN_DONE_72 (ecmis-app.js:338) — เดิม to:'PENDING_INVITE_72'
{ from:'IN_SCREENING_72', to:'PENDING_SIGN_AGENDA_72', event:'SCREEN_DONE_72', actor:'subcommittee',
  ref:'กลั่นกรองแล้วเสร็จ — เสนอประธานฯ ลงนามสั่งบรรจุวาระ',
  guard:k => !k.subOutcome || (SUB_OUTCOME_MAP[k.subOutcome] || {}).localStatus === 'DONE',
  note:'อนุญาตเมื่อ subOutcome เป็นกลุ่ม DONE (ชี้มูล / ไม่ชี้มูล / ตกไป) — "ทำเพิ่มเติม" ต้องใช้ SCREENING_RETURN_72' },

// เพิ่ม 2 แถว chairman (หลัง SCREENING_RESUBMIT_72)
{ from:'PENDING_SIGN_AGENDA_72', to:'PENDING_INVITE_72', event:'SIGN_AGENDA_72', actor:'chairman',
  ref:'ประธานฯ ลงนามสั่งบรรจุระเบียบวาระการประชุมคณะกรรมการ ป.ป.ท. (วาระที่ ๕)' },
{ from:'PENDING_SIGN_AGENDA_72', to:'IN_SCREENING_72', event:'CHAIRMAN_RETURN_SCREENING_72', actor:'chairman',
  ref:'ประธานฯ ตีกลับให้คณะอนุกลั่นกรองฯ ทบทวนความเห็น' },
```

### Task 3 — `assets/ecmis-app.js`: PAGE_FOR_72 / STATUS_STEP_72 / ACT7_STAGE_72
```js
PAGE_FOR_72:   PENDING_SIGN_AGENDA_72:'chairman-agenda.html',
STATUS_STEP_72: PENDING_SIGN_AGENDA_72:'agenda72',
ACT7_STAGE_72:  PENDING_SIGN_AGENDA_72:1,
```

### Task 4 — `chairman-agenda.html` (+`res/`): สาขา docket-sign
```js
function isDocketSignStep(){ return kase.status === 'PENDING_SIGN_AGENDA_72'; }
```
- **renderDoc()** สาขาใหม่ (`else if (isDocketSignStep())` — วางก่อน `else if (isAssignStep())`):
  render A4 house-style **"บันทึกความเห็นคณะอนุกลั่นกรองฯ นำเรียนประธานฯ"** (ร่างอนุมัติแล้ว — ดู §4.1):
  ครุฑ + บันทึกข้อความ + ส่วนราชการ (ฝ่ายเลขานุการคณะอนุฯ คณะที่ `M(kase.subCommittee)`) + เรื่อง + เรียน ประธานกรรมการ ป.ป.ท. +
  ย่อหน้า merge field `caseId / subject / ownerOrg / subMeetingNo / subMeetingDate` +
  บล็อกมติ/ความเห็น `M(kase.subOpinion || SUB_OUTCOME_MAP[kase.subOutcome]?.label)` +
  ย่อหน้าปิด "จึงเรียนมาเพื่อโปรดพิจารณาลงนามสั่งบรรจุ..." + ช่องลงนามประธานฯ (`SIGNER_NAME/TITLE`)
- **buildButtons()** สาขาใหม่ (บนสุด):
  ```js
  if (isDocketSignStep()) return [
    { act:'return_screening', label:'ตีกลับให้คณะอนุกลั่นกรองฯ ทบทวน', icon:'fa-arrow-left-long', cls:'btn-outline-danger' },
    { act:'sign_agenda',      label:'ลงนามสั่งบรรจุวาระ',              icon:'fa-signature',       cls:'btn-gold' }
  ];
  ```
- **handle('sign_agenda')** — แพตเทิร์นเดียวกับ `assign_screening` (grill-me `2026-09-08`):
  `signDialog('บันทึกความเห็นอนุกลั่นกรองฯ นำเรียนประธานฯ สั่งบรรจุวาระ — เรื่องที่ '+kase.id, SIGNER_NAME+' — '+SIGNER_TITLE)`
  → `SignatureStore.create({docType:'บันทึกความเห็นอนุกลั่นกรองฯ (สั่งบรรจุวาระ)', signerRole:'chairman'})`
  → `pushCaseHistory(kase,{from:'PENDING_SIGN_AGENDA_72', to:'PENDING_INVITE_72', event:'SIGN_AGENDA_72', actor:'chairman'})`
  → `await ECMIS.updateCaseStatus(kase, 'PENDING_INVITE_72', sb)` + `logRequestEvent(..., {type:'SIGNED', actorRole:'chairman'})`
  → toast → redirect `inbox.html`
- **handle('return_screening')** — `confirmAction` (textarea เหตุผล *required*) →
  `kase.chairmanReturnReason72 = reason`; `pushCaseHistory(kase,{from:'PENDING_SIGN_AGENDA_72', to:'IN_SCREENING_72', event:'CHAIRMAN_RETURN_SCREENING_72', actor:'chairman', note:reason})`;
  `await ECMIS.updateCaseStatus(kase, 'IN_SCREENING_72', sb)` (+ persist reason ผ่าน resolutionData ถ้ามี sb) → toast → redirect `inbox.html`

### Task 5 — `inbox.html` (+`res/`): KPI ประธาน "รอลงนามบรรจุวาระ"
- `isChairActionable(c)` += `|| c.status === 'PENDING_SIGN_AGENDA_72'` (`inbox.html:232`)
- `renderKPICards` chairman branch (`inbox.html:424-432`): เพิ่ม
  `const pendingSignAgendaCount = allCasesCombined.filter(c => c.status === 'PENDING_SIGN_AGENDA_72').length;`
  + การ์ด `{ id:'PENDING_SIGN_AGENDA', n: pendingSignAgendaCount, l:'รอลงนามบรรจุวาระ', i:'fa-calendar-check', c:'#0F766E' }`
- filter `<option>` (`:386`) + `applyFilters` match (`:837`): `st === 'PENDING_SIGN_AGENDA'` → `c.status === 'PENDING_SIGN_AGENDA_72'`
- routing block: `PENDING_SIGN_AGENDA_72` ตกลง `else` → `chairman-agenda.html` อยู่แล้ว — เพิ่ม comment

### Task 6 — `subcommittee-screening.html` (+`res/`): banner เหตุตีกลับประธาน
- ตอน render: ถ้า `kase.status === 'IN_SCREENING_72' && kase.chairmanReturnReason72` → แสดง alert สีเหลืองบนฟอร์ม
  "⟳ ประธานฯ ตีกลับให้ทบทวนความเห็น: {chairmanReturnReason72}" (คณะอนุฯ แก้ subOutcome/subOpinion เดิมได้ตามปกติ เพราะ `isScreeningLocked` = false)
- ตอน `handle('save_status')` / SCREEN_DONE_72 สำเร็จ: `delete kase.chairmanReturnReason72` (หรือ set '')

### Task 7 — Sync + Docs
`npm run sync` (chairman-agenda.html, inbox.html, subcommittee-screening.html → `res/`) · อัปเดต `CLAUDE.md` ถ้าจำเป็น

### Task 8 — DB Migration (⚠️ ต้องรันแยกโดยผู้มีสิทธิ์ DDL)
ไฟล์: `sql/add_chairman_sign_statuses.sql` (commit `e7ecbb9`) — DROP/ADD `tbl_res_request_trr_status_check`
เพิ่มรหัส `020/021/117/118/119`. รันที่ **Supabase Dashboard → SQL Editor → Run** (หรือผู้ถือ `service_role` key).
anon publishable key ที่ demo ใช้รัน `ALTER` ไม่ได้ — ถ้ายังไม่รัน เคส 7.2 ที่ต่อ Supabase จะค้างที่สถานะก่อน 118/119
(บันทึกที่ Obsidian `Activity_7_DB_History_2026-09-09.md`)

### 4.1 ร่างเอกสาร (อนุมัติแล้ว)
```
บันทึกข้อความ
ส่วนราชการ  สำนักงาน ป.ป.ท.  กองบริหารคดี (ฝ่ายเลขานุการคณะอนุกรรมการกลั่นกรองฯ คณะที่ {subCommittee})
ที่  ปปท ๐๐๐๔/ …     วันที่  {today}
เรื่อง  เสนอความเห็นของคณะอนุกรรมการกลั่นกรองเรื่องไต่สวนข้อเท็จจริง เพื่อโปรดพิจารณาสั่งบรรจุระเบียบวาระการประชุม

เรียน  ประธานกรรมการ ป.ป.ท.

     ตามที่คณะอนุกรรมการกลั่นกรองเรื่องไต่สวนข้อเท็จจริง คณะที่ {subCommittee} ได้พิจารณากลั่นกรองสำนวน
เรื่องเสร็จที่ {caseId} เรื่อง {subject} ซึ่งมี {ownerOrg} เป็นผู้รับผิดชอบสำนวน
ในคราวประชุมครั้งที่ {subMeetingNo} เมื่อวันที่ {subMeetingDate} นั้น

     คณะอนุกรรมการกลั่นกรองฯ พิจารณาแล้ว มีมติ/ความเห็น: {subOpinion / SUB_OUTCOME_MAP[subOutcome].label}

     จึงเรียนมาเพื่อโปรดพิจารณาลงนามสั่งบรรจุเรื่องดังกล่าวเข้าระเบียบวาระการประชุมคณะกรรมการ ป.ป.ท.
     (ระเบียบวาระที่ ๕ เรื่องเสนอให้ที่ประชุมพิจารณา) ต่อไป

               (ลงชื่อ) ...........................................
                        (นายวิชัย ยุติธรรม)
                   ประธานกรรมการ ป.ป.ท.
```

---

## 🧪 5. Verification & Quality Gate Matrix

### 5.1 Manual UI (role chairman + subcommittee, ต่อ Supabase จริง)
| # | ขั้นตอน | ผลที่คาดหวัง |
|---|---|---|
| V1 | subcommittee (คณะที่ N) เคส `IN_SCREENING_72` → กด "ลงนามรับรองมติ" + "บันทึกเพื่อส่งมติ" (subOutcome = INDICT) | สถานะ `PENDING_SIGN_AGENDA_72` (ไม่ใช่ `PENDING_INVITE_72`), Supabase `trr_status=119`, history `SCREEN_DONE_72` |
| V2 | login chairman → `inbox.html` | เคสโผล่การ์ดใหม่ **"รอลงนามบรรจุวาระ"** + ปุ่ม "พิจารณาสั่งการ" |
| V3 | เปิด `chairman-agenda.html` | เห็นเอกสาร "บันทึกความเห็นคณะอนุกลั่นกรองฯ นำเรียนประธานฯ" (merge field ครบ: คณะที่/ครั้งที่ประชุม/มติ) + 2 ปุ่ม (ลงนามสั่งบรรจุวาระ / ตีกลับ) |
| V4 | กด "ลงนามสั่งบรรจุวาระ" → signDialog → ยืนยัน | สถานะ `PENDING_INVITE_72`, Supabase `trr_status=109`, history `SIGN_AGENDA_72`, redirect inbox |
| V5 | login board_sec → `agenda-registry.html` | เคสโผล่คิว "รอบรรจุวาระ" ตามปกติ (flow ปลายทางไม่กระทบ) |
| V6 | *(อีกเคส)* chairman กด "ตีกลับให้คณะอนุกลั่นกรองฯ ทบทวน" + ระบุเหตุ | สถานะ `IN_SCREENING_72`, history `CHAIRMAN_RETURN_SCREENING_72`, `chairmanReturnReason72` บันทึก |
| V7 | login subcommittee (คณะเดิม) → เปิดเคสจาก V6 ใน `subcommittee-screening.html` | ฟอร์ม **ปลดล็อค** (แก้ subOutcome/subOpinion เดิมได้) + banner เหลือง "ประธานฯ ตีกลับ: <เหตุ>" |
| V8 | subcommittee แก้มติ + ส่งมติใหม่ | กลับเข้า `PENDING_SIGN_AGENDA_72` อีกครั้ง, banner หาย |
| V9 | เคสเร่งด่วน 7.2 (`PENDING_CHAIRMAN_URGENT_72` → บรรจุวาระด่วน) | ยังไป `PENDING_INVITE_72` ตรง ไม่แตะ `PENDING_SIGN_AGENDA_72` |
| V10 | Console ทุกหน้า | ไม่มี error / `PENDING_SIGN_AGENDA_72 undefined` |

### 5.2 Automated
- [ ] `npm run sync` (3 root → `res/`)
- [ ] `npm test` (5-Layer CI) ผ่าน 100% — Layer 1 parse, Layer 3 `PENDING_SIGN_AGENDA_72` ไม่ทำ 404, Layer 4 RBAC
- [ ] `npm run test:integration` (แตะ STATUS/persistence 7.2)

### 5.3 Anti-Regression เฉพาะจุด
- [ ] `subcommittee-screening.html` เคสที่ยัง `IN_SCREENING_72` (ไม่เคยตีกลับ) — ไม่มี banner, lock ทำงานหลังส่งมติ
- [ ] `SCREENING_RETURN_72` (subOutcome = NEED_MORE) ยังไป `RETURNED_72` เหมือนเดิม (ไม่โดน retarget)
- [ ] `agenda-registry.html` เคส `PENDING_INVITE_72` ที่มาจาก `SIGN_AGENDA_72` — บรรจุวาระได้ปกติ
- [ ] stepper 72 (`ECMIS.stepperHtml`) แสดง `PENDING_SIGN_AGENDA_72` กลุ่ม `agenda72` ไม่พัง
- [ ] เคสเดิมที่ค้าง `PENDING_INVITE_72` อยู่แล้วในระบบ — ไม่ถูกกระทบ (transition เก่าไม่ลบ)

---

## 🏁 6. Completion & Sign-off

- **Completed Date:** 2026-09-09 (implement + spot-check + commit)
- **Commit Reference:** _(local `pre-main`, ยังไม่ push)_
- **Notes / Retrospective:**
  - grill-me 7 รอบ + NotebookLM 8 queries — พบว่าขั้น `PENDING_CHAIRMAN_72` (chairman-assign, `2026-09-08`) **ตรง**กับ NotebookLM อยู่แล้ว (ประธานลงนามมอบหมายทั้งสาย, ทั้งสายผ่านอนุกลั่นกรอง); gap จริงคือ **ลายเซ็นประธานที่ 2** (สั่งบรรจุวาระ หลังกลั่นกรอง) = G3 รอบนี้
  - **⚠️ DB migration ที่ต้องรันแยก (ไม่มีสิทธิ์ DDL ผ่าน anon key):** Supabase CHECK constraint `tbl_res_request_trr_status_check` **ไม่รองรับรหัสสถานะ `'118'` (PENDING_CHAIRMAN_72) และ `'119'` (PENDING_SIGN_AGENDA_72)** — write ที่พยายามลง 118/119 ถูก reject (`new row ... violates check constraint`). เป็น pattern เดียวกับ Task 85 (`'021'`/`'117'` ก็ยังขาด). โค้ด/flow ถูกต้อง แต่ demo ที่ต่อ Supabase จริงจะค้างที่สถานะก่อนหน้าจนกว่า constraint จะอัปเดต. SQL ที่ต้องรัน (service-role / SQL editor):
    ```sql
    ALTER TABLE tbl_res_request DROP CONSTRAINT tbl_res_request_trr_status_check;
    ALTER TABLE tbl_res_request ADD CONSTRAINT tbl_res_request_trr_status_check
      CHECK (trr_status ~ '^[0-9]{3}$');   -- หรือ enumerate ให้ครบทุกรหัสใน ECMIS.STATUS_CODE
    ```
  - **Spot-check (role subcommittee + chairman, Supabase จริง, เคส `1233/2566` คณะที่ 5):**
    - V1: subcommittee ส่งมติ (INDICT) → `persistSubOutcome` คำนวณ `targetStatus = PENDING_SIGN_AGENDA_72` ถูกต้อง (`ECMIS.CASES` in-memory = 119); Supabase ค้างที่ 108 เพราะ constraint + fire-and-forget race ใน `persistPatch` (บั๊กเดิม) — patch DB เพื่อเดินต่อ
    - V2: chairman inbox — การ์ด KPI "รอลงนามบรรจุวาระ" + filter option แสดงถูกต้อง
    - V3: chairman-agenda render บันทึกความเห็นอนุกลั่นกรองฯ (merge field คณะที่/ครั้งประชุม/มติ ครบ) + 2 ปุ่ม (`return_screening` / `sign_agenda`)
    - V4: กด "ลงนามสั่งบรรจุวาระ" → signDialog → `PENDING_INVITE_72` (Supabase `trr_status=109` **persist สำเร็จ** เพราะ 109 เป็นรหัสเดิม), history `SIGN_AGENDA_72`, ไม่มี console error
    - V6: กด "ตีกลับให้คณะอนุกลั่นกรองฯ ทบทวน" + ระบุเหตุ → `IN_SCREENING_72` (Supabase `trr_status=108`), `trr_resolution_data.chairmanReturnReason72` **persist สำเร็จ** (JSONB merge)
    - V7: subcommittee เปิดเคส → ฟอร์ม**ปลดล็อค** (`isScreeningLocked=false`) + banner เหลือง "ประธานฯ ตีกลับ: <เหตุ>" แสดงถูกต้อง; ไม่มี console error
    - `npm test` 5/5 · `npm run test:integration` 60/60 · `npm run sync` — ผ่านทั้งหมด
    - เคส `1233/2566` restore กลับ `108 IN_SCREENING_72` / sub คณะที่ 5 / resolution_data null เรียบร้อย
  - **Deferred gaps (บันทึกไว้ ไม่ทำ):**
    - **G1** — สายกองปราบ vs เขต ต่างเส้นทางเอกสารก่อนถึงประธาน (กองปราบทำบันทึกเสนอเอง / เขต case_admin สแกน). ผู้ใช้ระบุ "ปราบเขตมีหน้าที่ส่งมาให้เรา ไม่ต้องออกแบบหน้าจอฝั่งเขา" → กระบวนงานหลักเหมือนกัน ต่างแค่ธุรการภายนอกระบบ
    - **G2** — หลังคณะอนุสนับสนุนเลขาฯ (`IN_SUPPORT_SUB_72`) ควร **กลับมาเลขาฯ ลงนามขั้นสุดท้าย** ก่อนไปประธาน (ตอนนี้ `SUPPORT_DONE_72` → `PENDING_CHAIRMAN_72` ตรง) + **shortcut**: ถ้าคณะอนุสนับสนุนเลขาฯ เห็นสอดคล้องกับผู้รับผิดชอบสำนวน → เสนอประธานบรรจุวาระได้ทันที **ข้ามคณะอนุกลั่นกรองฯ**
    - **G4-doc1** — บันทึกเสนอนำเรียนประธานฯ ก่อนลายเซ็นที่ 1 (ปัจจุบัน `chairman-agenda.html` โหมด assign render "บันทึกมอบหมายให้กองบริหารคดีส่งคณะอนุกรรมการกลั่นกรองฯ" ใกล้เคียงพอ)
    - (b เดิม จาก `2026-09-08`) ประธานลงนามบรรจุวาระหลังกลั่นกรอง = **ทำแล้วในแผนนี้** · G-B cap 40/คณะ · G-C bypass "กลุ่มกิจการฯ กลั่นกรองแทน"
