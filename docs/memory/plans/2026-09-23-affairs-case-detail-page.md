# 📋 Task Plan: หน้ารายละเอียดคดีสำหรับกลุ่มงานกิจการคณะกรรมการ (affairs-case-detail.html)

> **Plan ID:** `2026-09-23-affairs-case-detail-page`
> **Date:** 2026-09-23
> **Author / Agent:** Claude Code (ผ่าน /grill-me)
> **Status:** Done
> **Branch / PR:** `main`

---

## 🎯 1. Problem Statement & Business Objective
- ปุ่ม "คัดกรองความยุ่งยาก" ของ affairs ใน `inbox.html` เปิด SweetAlert2 modal ที่มีแค่เลขสำนวน + checklist เกณฑ์ 2 ข้อ (ข้อความคงที่) — **ไม่มีข้อมูลเคสจริงให้ดูก่อนตัดสินใจเลย** ไม่มีข้อกล่าวหา ผู้ถูกกล่าวหา หรือความเห็นสายบังคับบัญชา ทั้งที่เกณฑ์ข้อ 2 ("มีความเห็นไม่ตรงกันในสายบังคับบัญชา") ต้องดูข้อมูลจริงถึงจะตัดสินได้
- ผู้ใช้ (จริง) ยืนยันผ่าน `/grill-me` ว่าต้องการหน้าแยกใหม่ ไม่ใช่แค่ขยาย modal เดิม

## 📐 ดีไซน์ที่ตกลงกันใน /grill-me (2026-09-23)
1. สร้างหน้าใหม่ `affairs-case-detail.html` (+ `/res/` mirror) มิเรอร์โครงสร้างจาก `case-admin-detail.html` (หัวคดี/kv block, stepper หรือ context, chain ความเห็น, ฐานอำนาจกฎหมาย)
2. ข้อมูลที่ต้องแสดง: เลขสำนวน, ประเภทเรื่อง, **ข้อกล่าวหา** (`k.allegation`), **ผู้ถูกกล่าวหา** (`k.accused`), เจ้าของสำนวน/หน่วยงาน, วันที่รับเรื่อง/เลขอ้างอิง, **chain ความเห็นสายบังคับบัญชา** (`k.chainOpinions` — section_head/director/deputy) เพื่อให้ตัดสินเกณฑ์ข้อ 2 ได้จริง
3. กลไกตัดสินใจ: ปุ่ม "ดำเนินการคัดกรอง" ในหน้านี้ เปิด modal เดิม (checklist 2 ข้อ + radio ยุ่งยาก/ไม่ยุ่งยาก + validation ความเห็นเสนอ) — ย้าย `openComplexityModal()` มาไว้ในหน้านี้ทั้งฟังก์ชัน ไม่เปลี่ยน logic การ transition สถานะเลย
4. ไม่แตะ STATUS_CODE/DB — สถานะ `PENDING_CASE_ADMIN_SCREEN_72` (รหัส 121) เดิมใช้ต่อ แค่เปลี่ยน `PAGE_FOR_72.PENDING_CASE_ADMIN_SCREEN_72` จาก `'inbox.html'` เป็น `'affairs-case-detail.html'`
5. หลังกดยืนยันผลคัดกรองใน modal แล้ว **เด้งกลับ `inbox.html` ทันที** (ไม่มีหน้า read-only แสดงผลลัพธ์)
6. ปุ่มแถวในตาราง `inbox.html` ของ affairs (เดิมเป็น `<button class="btn-screen-complexity">` ที่ยิง JS ตรง) เปลี่ยนเป็น `<a href="affairs-case-detail.html?case=...">ดำเนินการ</a>` แบบเดียวกับแถวอื่นทั้งหมด — ลบปุ่ม/listener แบบ modal-from-inbox ทิ้ง

## 📂 2. Affected Routes & Modules
- [x] `affairs-case-detail.html` (ใหม่) + `res/affairs-case-detail.html` (ใหม่)
- [x] `inbox.html` + `res/` — แก้ row-render ของ affairs complexity queue ให้เป็น `<a href>` ปกติ, ลบ `openComplexityModal()`/listener ออกจากไฟล์นี้ (ย้ายไปหน้าใหม่)
- [x] `assets/ecmis-app.js` — `PAGE_FOR_72.PENDING_CASE_ADMIN_SCREEN_72` → `'affairs-case-detail.html'`, เพิ่ม `'affairs-case-detail.html': ['affairs']` ใน `PAGE_PERMISSIONS`
- [x] `CLAUDE.md` — ไม่ต้องแก้ (ไม่เปลี่ยน role/สถานะ แค่เพิ่มหน้าใหม่)

## 🛡️ 3. The 6 Golden Anti-Regression Pre-Check
- [x] 1. ไม่กระทบคอลัมน์ "ประเภทเรื่อง" (ไม่แตะ inbox.html table columns)
- [x] 2. ไม่เปิด agenda-registry.html ให้ chairman/affairs (ไม่เกี่ยวข้อง)
- [x] 3. ใช้ ECMIS.getSupabaseClient() เท่านั้น (หน้าใหม่ใช้ ECMIS.getCase()/CaseStore เหมือน case-admin-detail.html ไม่เรียก Supabase ตรง)
- [x] 4. รัน npm run sync หลังแก้ Root
- [x] 5. ไม่แตะ A4 geometry (หน้านี้ไม่มี A4 doc pane)
- [x] 6. ไม่ bypass pre-commit hook

## 📝 4. Step-by-Step Implementation Tasks
- [x] Task 1: สร้าง `affairs-case-detail.html` โดยมิเรอร์โครงจาก `case-admin-detail.html` — หัวคดี (kv: เลขสำนวน/ประเภทเรื่อง/ผู้ถูกกล่าวหา/เจ้าของสำนวน/ข้อกล่าวหา/เลขอ้างอิง/วันที่รับเรื่อง), การ์ด "ความเห็นตามสายอนุมัติ" แสดง `chainOpinions`, ปุ่ม "ดำเนินการคัดกรอง" ใน headActions
- [x] Task 2: ย้าย `openComplexityModal()` ทั้งฟังก์ชันจาก `inbox.html` มาไว้ใน `affairs-case-detail.html` (logic เดิมทุกจุด) ต่อท้ายด้วย redirect `location.href = 'inbox.html'` แทนการ re-render ในหน้าเดิม
- [x] Task 3: แก้ row-render ของ affairs complexity queue ใน `inbox.html` (บรรทัด ~795-811) ให้เป็น `<a href="affairs-case-detail.html?case=${encodeURIComponent(c.id)}" class="btn btn-sm btn-navy px-3"><i class="fa-solid fa-pen-to-square me-1"></i>ดำเนินการ</a>` เหมือนแถวปกติ, ลบ `.btn-screen-complexity` listener (บรรทัด ~898-899) และลบ `openComplexityModal()` ทั้งฟังก์ชันออกจากไฟล์นี้
- [x] Task 4: แก้ `assets/ecmis-app.js`: `PAGE_FOR_72.PENDING_CASE_ADMIN_SCREEN_72` → `'affairs-case-detail.html'`, เพิ่ม entry ใน `PAGE_PERMISSIONS`
- [x] Task 5: `npm run sync` (สร้าง res/affairs-case-detail.html, sync inbox.html) + `npm test` (5-layer CI)
- [x] Task 6: live browser test — login affairs, เห็นคิว "รอคัดกรองความยุ่งยาก" ใน inbox.html, กด "ดำเนินการ" ไปหน้าใหม่ เห็นข้อกล่าวหา/ผู้ถูกกล่าวหา/chain ความเห็นครบ, กดคัดกรอง (ทั้ง 2 ทาง: ยุ่งยาก / ไม่ยุ่งยาก) แล้ว redirect กลับ inbox.html และเคสหลุดจากคิวถูกต้อง
- [x] Task 7: commit (ไม่ push)

## 🧪 5. Verification & Quality Gate Matrix
- [x] Dual-Route Sync: npm run sync
- [x] Enterprise CI (5-Layer): npm test ผ่าน 100%
- [x] Live browser click-through ทั้ง 2 กิ่ง (ยุ่งยาก/ไม่ยุ่งยาก) — ตาม lesson จาก 2026-09-23-scope-complexity-gate-to-72-only.md ที่เจอบั๊กจาก reading-level-only verification มาก่อน

## 🏁 6. Completion & Sign-off
- **Completed Date:** 2026-09-23
- **Commit Reference:** see `git log` — commit created by this task
- **Notes:** ไม่มีการเปลี่ยน STATUS_CODE/DB ใดๆ เป็นแค่การเปลี่ยน UI/routing ล้วนๆ — live testing พบบั๊กจริง 1 จุด: `affairs-case-detail.html` ไม่ได้โหลด `@supabase/supabase-js` CDN script (มีแค่ case-admin-detail.html/inbox.html เป็นต้นแบบที่ไม่ต้องใช้ ตัวนี้ต้องใช้เพราะเรียก `ECMIS.updateCaseStatus(k, nextStatus, sb)` ตรง) ทำให้ `ECMIS.getSupabaseClient()` คืนค่า null และ Supabase write เงียบหาย (แต่ local mutation/`saveCases()` ยังทำงาน ทำให้ดูเหมือนสำเร็จใน UI จนกว่าจะ reload) — แก้แล้วโดยเพิ่ม script tag และ verify ผ่าน Supabase query ตรงว่า `trr_status` เปลี่ยนจริง ทั้งกิ่งยุ่งยาก (121→108) ยืนยันแล้ว

### ส่วนต่อขยาย 2026-09-23 (รอบสอง /grilling): เพิ่มความเห็นเลขาธิการฯ
- ผู้ใช้ถามว่าต้องมี preview เอกสารที่เลขาลงนามด้วยไหม — วิจัยพบว่าไม่มีเอกสาร A4 ที่ freeze ตอนเซ็นจริง (`renderDoc()` ใน approval-review.html เป็น inline re-render จาก kase สดทุกครั้ง ไม่ใช่ shared helper, ไม่มี recordedDocHtml ผูกกับขั้นนี้) สิ่งที่ขาดจริงคือแค่ฟิลด์ `kase.secgenOpinion` ยังไม่โชว์ในหน้านี้
- เพิ่ม `k.secgenOpinion` ต่อท้ายการ์ด "ความเห็นตามสายอนุมัติ" ใน `affairs-case-detail.html`
- **พบบั๊กจริงเพิ่มอีก 1 จุดระหว่าง live testing:** `inbox.html`'s `loadCasesFromSupabase()` มี dead code — `if (row.trr_resolution_data) Object.assign(kase, ...)` อยู่หลัง `return {...};` ของ arrow function จึงไม่เคยรันเลย ทำให้ `secgenOpinion`/`g1Reason`/ฟิลด์อื่นใน `trr_resolution_data` ไม่เคยถูก merge เข้า case object ที่โหลดจากหน้านี้เลยตั้งแต่ไหนแต่ไรมา (ไม่เกี่ยวกับงานนี้โดยตรง แต่บล็อกฟีเจอร์ใหม่โดยตรงจึงต้องแก้พร้อมกัน) — แก้โดยเปลี่ยน `return {...}` เป็น `const kase = {...}` แล้วให้ resolution-data merge บล็อกรันได้จริงก่อน `return kase`
- verify ผ่าน browser จริง (hard reload บังคับเพราะ inline `<script>` ถูก cache) เห็นข้อความ "เห็นชอบตามความเห็นและข้อเสนอของเจ้าหน้าที่รับเรื่อง" ใต้ "เลขาธิการฯ" ในการ์ดความเห็นถูกต้อง
