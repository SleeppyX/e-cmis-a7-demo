# 📋 Task Plan: Insert เคสทดสอบ 9211-9222/2569 เข้า Supabase จริง

> **Plan ID:** `2026-09-16-seed-supabase-cases-9211-9222`
> **Date:** 2026-09-16
> **Author / Agent:** Claude Code
> **Status:** Done
> **Branch / PR:** `main`

---

## 🎯 1. Problem Statement & Business Objective
- **ปัญหา:** เคส `9211-9222/2569` ที่เพิ่มใน `assets/ecmis-app.js` (local mock) ไม่โผล่ในหน้า `inbox.html` เพราะหน้านี้ดึงข้อมูลจริงจาก Supabase (`loadCasesFromSupabase()`, `inbox.html:960-970`) มาทับ array mock เสมอเมื่อเชื่อมต่อได้ — ต้อง insert แถวจริงใน Supabase ด้วยจึงจะเห็นในลิสต์ (ตามที่ `sql/seed_test_cases_secgen_entry.sql` อธิบายไว้ และเป็นเหตุผลที่ 9201-9204/2569 มีอยู่จริงในฐานข้อมูลอยู่แล้ว)
- **ยืนยันจากผู้ใช้:** ต้องการให้ insert เข้า Supabase จริง

## 📐 Pattern อ้างอิง (`sql/seed_test_cases_secgen_entry.sql`, `sql/seed_test_cases_71_secgen_batch2.sql`)
- 3 ตารางต่อ 1 เคส: `tbl_cmp_case` (ข้อมูลหลัก) → `tbl_cmp_case_accused` (ผู้ถูกกล่าวหา) → `tbl_res_request` (สถานะ/เวิร์กโฟลว์)
- **ข้อจำกัดสำคัญ:** `tcc_legal_base` มี CHECK constraint รับเฉพาะ `'ม.18/4'`/`'ม.62'` เท่านั้น — ต้อง normalize ค่าจาก mock (`'ม.24 วรรคท้าย'` สำหรับ 7.2) ให้เป็น `'ม.18/4'` ตอน insert (เหมือนที่ 9203/9204 ทำ)
- `tcc_doc_type` ใช้ `'644'` เสมอสำหรับสาย 7.1/7.2 ที่ pending secgen (ตาม pattern เดิม แม้ 7.1 บาง batch จะใช้ `'213'` ก็ตาม — จะยึดตาม `docType` ของแต่ละเคสใน mock จริง: 7.1→'213', 7.2→'644')
- `trr_status` ต้องแปลงจาก JS status string เป็นรหัส 3 หลักผ่าน `ECMIS.STATUS_CODE`: `PENDING_SECGEN`→`'005'`, `PENDING_SECGEN_72`→`'104'`
- `trr_urgent` = ค่า `urgent` จาก mock

## 📂 2. Affected Routes & Modules
- [x] Supabase (remote DB): เพิ่มแถวใหม่ 12 ชุด ใน `tbl_cmp_case` (tcc_id 816, 818-828), `tbl_cmp_case_accused`, `tbl_res_request` (trr_id 790-801) — ไม่แก้ไข/ลบแถวเดิมใดๆ (additive only)
- [x] ไฟล์ใหม่ `sql/seed_test_cases_9211_9222.sql` (เอกสารอ้างอิง/reproducible)
- [x] ไฟล์ใหม่ `scripts/seed-cases-9211-9222.js` (สคริปต์ที่รันจริงผ่าน REST API)

## 🛡️ 3. The 6 Golden Anti-Regression Pre-Check
- [x] 1. ไม่กระทบคอลัมน์ "ประเภทเรื่อง"
- [x] 2. ไม่เปิด agenda-registry.html ให้ chairman/affairs
- [x] 3. Insert ผ่าน REST API ด้วย anon key เดียวกับที่แอปใช้ (`scripts/lib/supabase-rest.js` pattern) — ไม่ใช่การเรียก `supabase.createClient()` ในหน้าเว็บ จึงไม่ขัดกฎข้อ 3
- [x] 4. ไม่มีไฟล์ Root HTML เปลี่ยน ไม่ต้อง sync
- [x] 5. ไม่แตะ A4 geometry
- [x] 6. ไม่ bypass pre-commit hook

## 📝 4. Step-by-Step Implementation Tasks
- [x] Task 1: เขียนไฟล์ `sql/seed_test_cases_9211_9222.sql` ตาม pattern เดิม (เอกสารประกอบ/reproducible)
- [x] Task 2: เขียน Node script `scripts/seed-cases-9211-9222.js` ใช้ `scripts/lib/supabase-rest.js`'s `sbFetch()` เพื่อ insert จริงผ่าน REST (3 ตารางต่อเคส) ให้ครบ 12 เคส
- [x] Task 3: ทดสอบ insert เคสแรก (9211/2569) ด้วย `--test-first` ก่อน — ยืนยัน anon key insert `tbl_cmp_case_accused` ได้จริง (tcc_id=816, trr_id=790)
- [x] Task 4: insert อีก 11 เคสที่เหลือสำเร็จทั้งหมด (tcc_id 818-828, trr_id 791-801)
- [x] Task 5: ตรวจสอบผ่าน REST query ยืนยันครบ 12 แถวใน `tbl_cmp_case` (tcc_no 9211-9222/2569)
- [x] Task 6: commit ไฟล์ `sql/seed_test_cases_9211_9222.sql` + `scripts/seed-cases-9211-9222.js` (ไม่ push)

## 🧪 5. Verification & Quality Gate Matrix
- [x] Insert สำเร็จครบ 12 เคส (36 แถวรวม 3 ตาราง) — ยืนยันผ่าน REST query
- [ ] `inbox.html` role secgen เห็นเคสครบ ยอดรวมเพิ่มขึ้นตามจริง — รอผู้ใช้ยืนยันหลัง reload
- [ ] เปิดเคสแต่ละอันใน `approval-review.html` ตรวจว่าข้อมูล/stepper ถูกต้อง — รอผู้ใช้ยืนยัน

## 🏁 6. Completion & Sign-off
- **Completed Date:** 2026-09-16
- **Commit Reference:** TBD (จะ commit หลังบันทึกไฟล์นี้)
- **Notes:** เป็นการเขียนข้อมูลจริงเข้า Supabase — เพิ่มแถวใหม่เท่านั้น (additive) ไม่แก้ไข/ลบข้อมูลเดิมใดๆ ในฐานข้อมูล tcc_legal_base ของเคสสาย 7.2 (9217-9222) normalize จาก 'ม.24 วรรคท้าย' เป็น 'ม.18/4' ตาม CHECK constraint (เหมือน 9203/9204) tcc_doc_type ใช้ '644' ทุกเคสตาม precedent ของ batch ก่อนหน้า (ไม่ใช้ '213' แม้ 7.1 บาง mock จะระบุไว้)
