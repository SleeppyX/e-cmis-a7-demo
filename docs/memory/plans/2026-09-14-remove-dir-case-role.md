# Plan: ลบ role ผอ.กบค. (dir_case) ออกทั้งหมด + เปลี่ยนชื่อ case_admin

**วันที่:** 2026-09-14
**ผู้ร้องขอ:** ผู้ใช้ (ผ่าน /grilling)

## วัตถุประสงค์
- Role "ผอ.กบค." (`dir_case`) ไม่มีอยู่จริงใน ROLES array (เป็น virtual role ที่อ้างผ่าน owner/actor/getRole เท่านั้น) — ตัดสินใจเอาออกจากระบบทั้งหมด
- เปลี่ยนชื่อ role `case_admin` จาก "ผู้อำนวยการกองบริหารคดี ปฏิบัติหน้าที่เลขานุการคณะกรรมการ ป.ป.ท." เป็น "กบค.กลุ่มงานบริหารคดีและบริหารทั่วไป" (เปลี่ยนแค่ชื่อ/ตำแหน่งแสดง)
- ตัดขั้นตอน "รับรองใบด่วน" (URGENT_CERTIFY) ออกจาก flow ทั้ง 7.1/7.2 — เลขาธิการฯ เซ็นเคสด่วนแล้วเข้า PENDING_CHAIRMAN / PENDING_CHAIRMAN_URGENT_72 ทันที

## 6 Golden Rules Pre-check
1. ตาราง "ประเภทเรื่อง" — ไม่แตะ ✅
2. agenda-registry.html ไม่เปิดให้ chairman/affairs — ไม่แตะ ✅
3. Supabase Singleton — ใช้ script `scripts/lib/supabase-rest.js` เดิมสำหรับ data fix ✅
4. Root/`/res/` sync — ต้อง `npm run sync` หลังแก้ทุกไฟล์ ✅
5. A4 geometry — ไม่แตะ ✅
6. ไม่ bypass pre-commit hook ✅

## ไฟล์ที่ได้รับผลกระทบ (Root + /res/)
- `assets/ecmis-app.js` — ROLES[case_admin].title, STATUS (ลบ PENDING_URGENT/PENDING_URGENT_72), TRANSITIONS (ลบ URGENT_CERTIFY/URGENT_CERTIFY_72/URGENT_REJECT), PAGE_PERMISSIONS (ลบ dir_case จาก urgent-agenda.html)
- `assets/order-memo-docs.js` — ข้อความ "ผอ.กบค."/"ผู้อำนวยการกองบริหารคดี" ในแม่แบบเอกสารพิมพ์
- `approval-review.html` (+res) — save_status routing: urgent → ตรงไป PENDING_CHAIRMAN/PENDING_CHAIRMAN_URGENT_72, ตัด sequentialSignDialog กับ SEC signer คนที่ 2
- `urgent-agenda.html` (+res) — ตัด isCertifyStep branch + dirCase reference, เก็บ isSignStep ไว้
- `screening.html`, `subcommittee-screening.html` (+res) — role.id==='dir_case' → 'case_admin' (manualTeam)
- `board-resolution.html`, `resolution.html`, `resolution-72.html` (+res) — เปลี่ยนอ้างอิง getRole('dir_case') → case_admin
- `inbox.html` (+res) — cleanup comment
- `CLAUDE.md` — อัปเดต section 5 (case_admin description)

## Data fix
- Supabase: เคส `9209/2569` (trr_id=788) `trr_status` 007 (PENDING_URGENT) → PENDING_CHAIRMAN's code

## Verification
- `npm run sync` + `npm test` (CI 5/5)
- Query Supabase ยืนยันสถานะเคส 9209/2569 เปลี่ยนแล้ว
- grep ยืนยันไม่เหลือ `dir_case` ในโค้ด (ยกเว้น memory/ เอกสารเก่า)
