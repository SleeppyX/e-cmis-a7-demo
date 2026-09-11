# 📋 Task Plan: popup "ส่งเข้าคณะ" แสดงจำนวนสำนวนค้างจริงของอนุกลั่นกรอง (แทนโควตาหลอก)

> **Plan ID:** `2026-09-08-route-modal-real-subcommittee-load`
> **Date:** 2026-09-08
> **Author / Agent:** Claude Code
> **Status:** Verified (implemented + CI + browser test — ยังไม่ commit/push ตามคำสั่งผู้ใช้)
> **Branch / PR:** `pre-main`

---

## 🎯 1. Problem Statement & Business Objective

- **ปัญหา:** popup "ส่งเข้าคณะอนุกลั่นกรองฯ" (`openRouteModal`) ในหน้า `case-admin-inbox.html`
  และ `case-admin-detail.html` แสดง `SUBCOMMITTEE_QUOTA` ที่ hardcode:
  `[{n:1,used:40},{n:2,used:38},{n:3,used:22},{n:4,used:31},{n:5,used:40},{n:6,used:19},{n:7,used:27},{n:8,used:35}]`
  → "คณะที่ 1 (ใช้ไป 40/40) — เต็ม", "คณะที่ 5 — เต็ม", คณะอื่นตัวเลขมั่ว
  ตัวเลขเหล่านี้ไม่เกี่ยวกับสำนวนจริงเลย (mock จริงมีสูงสุด 7 สำนวน/คณะ) และ
  `nextSubcommitteeTeam()` เสนอคณะจากตัวเลขหลอกนี้

- **ต้องการ:** popup แสดง **จำนวนสำนวนที่ยังค้างระหว่างกลั่นกรองจริง** ต่อคณะ ๑–๘
  และ default เสนอคณะที่มีงานค้างจริงน้อยที่สุด

- **ข้อกฎหมาย/มติ:** ไม่มีข้อกฎหมายเฉพาะ — เป็นเรื่อง workload balancing ของ กบค.
  (ม.๒๔ วรรคสาม กรณีซับซ้อนแต่งตั้งคณะอนุกรรมการไต่สวน คือ downstream ของการกระจายนี้)

---

## 📂 2. Affected Routes & Modules

- [x] Assets JS: `assets/ecmis-app.js` — ลบ `SUBCOMMITTEE_QUOTA`, เพิ่ม `SUBCOMMITTEE_ACTIVE_STATUSES`
      + `subcommitteeActiveLoad(cases?)`, เขียน `nextSubcommitteeTeam(cases?)` ใหม่, แก้ export list
- [x] Root HTML: `case-admin-inbox.html` — `openRouteModal()` สร้าง `<option>` จาก load จริง (ส่ง `CASES` สด)
- [x] Root HTML: `case-admin-detail.html` — `openRouteModal()` เช่นเดียวกัน (ใช้ `ECMIS.CASES` — หน้านี้ไม่โหลด Supabase เอง)
- [x] Mirror HTML: `res/case-admin-inbox.html`, `res/case-admin-detail.html` — ผ่าน `npm run sync`
- [x] Docs: `CLAUDE.md` §5 (case_admin), `docs/memory/plans/2026-09-04-case-admin-role.md` — อัปเดตถ้อยคำ

---

## 🛡️ 3. The 6 Golden Anti-Regression Pre-Check

- [x] 1. ไม่กระทบคอลัมน์ "ประเภทเรื่อง"
- [x] 2. ไม่แตะ `PAGE_PERMISSIONS` / agenda-registry
- [x] 3. ไม่เรียก `supabase.createClient` ตรง — inbox เดิมมี fallback pattern อยู่แล้ว ไม่แตะ
- [x] 4. รัน `npm run sync` หลังแก้ root
- [x] 5. ไม่แตะ A4 / `ecmis-app.css`
- [x] 6. ไม่ใช้ `--no-verify`

---

## 📝 4. Step-by-Step Implementation Tasks

### Task 1 — `assets/ecmis-app.js` (แทนบล็อก `SUBCOMMITTEE_QUOTA` เดิม บรรทัด ~490)
```js
const SUBCOMMITTEE_ACTIVE_STATUSES = ['IN_SCREENING','IN_SCREENING_72','SCREENING_MORE_INFO','SCREENING_MORE_INFO_72'];

function subcommitteeActiveLoad(cases){
  const list = Array.isArray(cases) ? cases : CASES;
  const load = {};
  SUBCOMMITTEE_TEAMS.forEach(t => { load[t] = 0; });
  (list || []).forEach(c => {
    if (c && c.subCommittee && Object.prototype.hasOwnProperty.call(load, c.subCommittee)
        && SUBCOMMITTEE_ACTIVE_STATUSES.includes(c.status)) load[c.subCommittee]++;
  });
  return load;
}
function nextSubcommitteeTeam(cases){
  const load = subcommitteeActiveLoad(cases);
  return SUBCOMMITTEE_TEAMS.slice().sort((a,b) =>
    (load[a]-load[b]) || (SUBCOMMITTEE_TEAMS.indexOf(a)-SUBCOMMITTEE_TEAMS.indexOf(b)))[0];
}
```
- `SUBCOMMITTEE_ACTIVE_STATUSES` = ชุดเดียวกับ `ACTIVE_SCREEN` ใน `subcommitteeinbox.html` เพื่อให้ตัวเลขตรงกัน
- อ้าง `SUBCOMMITTEE_TEAMS` (บรรทัด 3023) + `CASES` (บรรทัด 919) ใน "body" เท่านั้น — call เกิดตอน user คลิก (หลัง module init) จึงพ้น TDZ
- แก้ export: `SUBCOMMITTEE_QUOTA` → `SUBCOMMITTEE_ACTIVE_STATUSES, subcommitteeActiveLoad`

### Task 2 — `case-admin-inbox.html` `openRouteModal(caseId)`
```js
const load = ECMIS.subcommitteeActiveLoad(CASES);        // CASES = live array (Supabase-loaded)
const suggested = ECMIS.nextSubcommitteeTeam(CASES);
const opts = ECMIS.SUBCOMMITTEE_TEAMS.map(t =>
  `<option value="${t}" ${t===suggested?'selected':''}>${t} — ค้าง ${load[t]} สำนวน${t===suggested?' (น้อยสุด)':''}</option>`
).join('');
```
+ แก้บรรทัด muted เป็น "ระบบเสนอ … — คณะที่มีสำนวนค้างระหว่างกลั่นกรองน้อยที่สุด"
- **ทุกคณะเลือกได้** — ไม่มี `disabled` / " — เต็ม" อีก
- preConfirm / pushCaseHistory / CaseStore.update / Supabase `trr_sub_committee` write — **คงเดิมทั้งหมด**

### Task 3 — `case-admin-detail.html` `openRouteModal()`
เหมือน Task 2 แต่ `ECMIS.subcommitteeActiveLoad()` / `ECMIS.nextSubcommitteeTeam()` **ไม่ส่ง arg**
(หน้านี้ไม่โหลด Supabase เอง → helper อ่าน `ECMIS.CASES` ในโมดูล)

### Task 4 — Docs
- `CLAUDE.md` §5: "round-robin จาก `SUBCOMMITTEE_QUOTA`" → "แสดงจำนวนสำนวนค้างจริง + เสนอคณะน้อยสุดผ่าน `subcommitteeActiveLoad`/`nextSubcommitteeTeam`"
- `docs/memory/plans/2026-09-04-case-admin-role.md` บรรทัด ~208 — อัปเดตรายการ helper

### Task 5 — Sync
`npm run sync` → `res/case-admin-inbox.html` + `res/case-admin-detail.html` ตาม

---

## 🧪 5. Verification & Quality Gate Matrix

### 5.1 Manual UI (role case_admin, ต่อ Supabase จริง)
| # | ขั้นตอน | ผลที่คาดหวัง |
|---|---|---|
| V1 | `case-admin-inbox.html` → กด "ส่งเข้าคณะ" ที่แถวหนึ่ง | popup แสดง 8 ตัวเลือก "คณะที่ N — ค้าง X สำนวน" · ไม่มี "เต็ม"/disabled |
| V2 | ตรวจ X ของคณะที่ 1 | ตรงกับจำนวนแถวใน `subcommittee-inbox.html` (สลับ header เป็นคณะที่ 1) ที่ status = PENDING/MORE_INFO (active screening) |
| V3 | ตัวเลือกที่ `selected` + ป้าย "(น้อยสุด)" | เป็นคณะที่ X ต่ำสุดจริง (เสมอ → เลขน้อยกว่า) |
| V4 | กระจายเคสเข้าคณะที่มี X ต่ำ → เปิด popup อีกเคส | X ของคณะนั้น +1 (ถ้าเคสใหม่ยัง active screening) · suggested อาจย้ายคณะ |
| V5 | `case-admin-detail.html?case=<id ในคิว>` → "ส่งเข้าคณะ" | popup เดียวกัน (นับจาก ECMIS.CASES) |
| V6 | เลือกคณะ ≠ suggested โดยไม่กรอกเหตุผล | preConfirm เตือน "กรุณาระบุเหตุผล…" (คงเดิม) |
| V7 | ยืนยันส่ง | pushCaseHistory `ROUTE_TO_SUBCOMMITTEE` + `subCommittee` ถูกเซ็ต + (inbox) เขียน Supabase `trr_sub_committee` |
| V8 | Console | ไม่มี error ใหม่ · ไม่มี `SUBCOMMITTEE_QUOTA is undefined` |

### 5.2 Automated
- [x] `npm run sync`
- [x] `npm test` (5-Layer) ผ่าน 100%
  - Layer 1: `ecmis-app.js` parse ผ่าน (ระวัง TDZ — call เกิด runtime เท่านั้น)
  - Layer 4: inbox ยังมี fallback pattern `supabase.createClient` + `ECMIS.getSupabaseClient`

### 5.3 Anti-Regression
- [x] grep ทั้ง repo: ไม่มีที่ไหนอ้าง `SUBCOMMITTEE_QUOTA` อีก (เดิม: ecmis-app.js, case-admin-inbox/detail + res, docs)
- [x] `screening.html` — sub-agent ยืนยันว่าไม่ได้อ้าง constant นี้ (แค่ comment เก่าบอกว่า "ชุดเดียวกัน")
- [x] handoff เดิม (subcommittee-inbox filter `c.subCommittee === team`) ไม่กระทบ

---

## 🏁 6. Completion & Sign-off

- **Completed Date:** 2026-09-08 (implement + verify; ยังไม่ commit)
- **Commit Reference:** _(ยังไม่ commit/push ตามคำสั่งผู้ใช้)_
- **ไฟล์ที่แก้จริง:** `assets/ecmis-app.js`, `case-admin-inbox.html` (+res), `case-admin-detail.html` (+res),
  `CLAUDE.md`, `docs/memory/plans/2026-09-04-case-admin-role.md`, ไฟล์แผนนี้
- **ผลทดสอบ (8 ก.ย. 2569, role case_admin, ต่อ Supabase จริง):**
  - `npm run sync` ✅ (case-admin-inbox/detail → res/ 2 ไฟล์) · `npm test` ✅ 5 ด่าน Errors 0
  - grep ทั้ง repo: `SUBCOMMITTEE_QUOTA` เหลือ 0 อ้างอิง ✅
  - V1 ✅ popup (inbox) 8 ตัวเลือก "คณะที่ N — ค้าง X สำนวน" ไม่มี disabled/"เต็ม"
  - V2 ✅ inbox popup คณะที่ 3 = "ค้าง 1 สำนวน" ตรงกับ `subcommittee-inbox` (คณะที่ 3 → "รอกลั่นกรอง 1", 1 แถว: 9113/2569)
  - V3 ✅ selected + "(น้อยสุด)" = คณะที่ค้างต่ำสุดจริง (tie 1 → คณะที่ 3 เลขน้อยสุด)
  - V5 ✅ detail popup (`?case=9101/2569`) นับจาก `ECMIS.CASES`: คณะ1=4, 2–6=3, 7=1, 8=1 · selected = คณะที่ 7 (tie 1 → เลขน้อย)
  - V6 ✅ เลือกคณะที่ 1 (≠ suggested) ไม่กรอกเหตุผล → "กรุณาระบุเหตุผล…" modal ค้าง (คงเดิม)
  - V7 ✅ ยืนยันคณะที่ 7 → `subCommittee='คณะที่ 7'` + history `ROUTE_TO_SUBCOMMITTEE` "…(Round-Robin)" + toast + stepper ขั้น 4 เขียว (detail = localStorage เท่านั้น ไม่แตะ Supabase — ยืนยันแล้ว row 9101 `trr_sub_committee`=null)
  - V8 ✅ 0 console error จากแอป · ไม่มี `SUBCOMMITTEE_QUOTA is undefined`
  - หลังทดสอบ: `localStorage.ecmis_live_cases` ถูกลบ · Supabase ไม่มีการเขียน
- **Notes:** helper รับ `cases?` optional — inbox ส่ง array สดจาก Supabase (ตัวเลขจึงต่างจาก detail),
  detail ใช้ `ECMIS.CASES` (mock/โมดูล) เพราะ detail ไม่มี `loadCasesFromSupabase` ของตัวเอง —
  ตรงตามที่ผู้ใช้เลือก "offline fallback = นับจาก ECMIS.CASES"
- **CLAUDE.md** แก้บนดิสก์แล้ว แต่ไฟล์ตั้ง `skip-worktree` (git ไม่เห็น diff — ปกติของโปรเจกต์นี้)
