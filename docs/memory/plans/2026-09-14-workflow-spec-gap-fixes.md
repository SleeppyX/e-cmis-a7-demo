# Plan: แก้ 5 gap จากการตรวจสอบ กจ7-workflow.txt (spec confirm จากลูกค้า)

**วันที่:** 2026-09-14
**บริบท:** ตรวจสอบ `C:\Users\Toon\OneDrive\Documents\กจ7-workflow.txt` (workflow ที่ confirm จากลูกค้าแล้ว)
เทียบกับระบบปัจจุบัน พบ 5 gap — ผู้ใช้ให้แก้ทั้ง 5 ข้อ ทำใน branch `pre-main` เพื่อทดสอบก่อน

## 5 Gap และวิธีแก้

1. **E9 — ไม่แยกคิว "สำนวนปราบ" vs "สำนวนเขต"**: เพิ่ม `ECMIS.caseOriginType()`/`caseOriginBadge()`
   (อนุมานจาก `ownerOrg` มีคำว่า "เขต" หรือไม่) แสดง badge ใน `case-admin-inbox.html`/`case-admin-detail.html`
   — ไม่แตะ state machine (เป็นข้อมูลแสดงผลเท่านั้น)
2. **E1/E7 — ไม่มีเส้นทางใบด่วนสาย 7.3**: `approval-review.html` เดิมซ่อน `urgentBox72` สำหรับ `isCase73`
   ทั้งหมด แก้ให้แสดงด้วย (คงซ่อนเฉพาะ m28Card ซึ่งไม่เกี่ยวกับด่วน) — เคส 7.3 urgent ใช้สถานะ
   `PENDING_URGENT`/`PENDING_CHAIRMAN` ร่วมกับสาย 7.1 อยู่แล้ว (ใช้ `procType` แยก ไม่ใช่ status แยก)
   แก้ `dir-case-urgent-review.html` ให้ไม่เสนอปุ่ม "ไม่รับรอง" สำหรับ 7.3 (ไม่มี IN_SCREENING ให้ไป)
3. **E3→E6 — ไม่มีขั้นกลุ่มกิจลงความเห็น 644 ก่อนบรรจุวาระ**: เพิ่มสถานะใหม่ `PENDING_AFFAIRS_OPINION_72`
   (owner affairs, code `121`) — `chairman-agenda.html` เพิ่มปุ่มที่ 2 ให้ประธานฯ เลือกได้ (สำนวนซับซ้อน
   → อนุกลั่นกรองฯ เดิม, ปกติ → ส่งกลุ่มกิจ) หน้าใหม่ `affairs-644-opinion.html` ให้ affairs ลงความเห็น
   แล้วส่งเข้า `PENDING_SIGN_AGENDA_72` เดิม (ใช้ซ้ำขั้นตอนประธานฯ ลงนามบรรจุวาระที่มีอยู่แล้ว)
4. (รวมกับข้อ 3 — เอกสาร "ใบบันทึกความเห็นกลุ่มกิจ" คือหน้า `affairs-644-opinion.html`)
5. **E3 — ไม่มี "ใบบันทึกปราบ" แยก**: `chairman-agenda.html`'s `assign_screening` action เปลี่ยนชื่อเอกสาร
   เป็น "ใบบันทึกปราบ" เมื่อเป็นเคส 7.1 origin=central (สำนวนปราบ) แทนชื่อทั่วไป
6. **E5 vs โค้ด (signer mismatch)**: ตัดสินใจไม่แก้ — น่าจะเป็นถ้อยคำ spec ที่หมายถึงประธานฯ ในฐานะ
   ตัวแทนคณะกรรมการ ไม่ใช่ gap จริง (ผู้ใช้เลือก "แก้ทั้ง 5 ข้อ" แต่ข้อนี้ไม่มีวิธีแก้โค้ดที่ชัดเจนโดยไม่เดา
   เจตนา — คงพฤติกรรมเดิมไว้)

## Known blocker — ใหญ่กว่าที่คาดไว้เดิม
ระหว่างทดสอบพบว่า live Supabase CHECK constraint (`tbl_res_request_trr_status_check`) อนุญาตแค่
code `000-020` และ `100-116` เท่านั้น **ไม่ใช่ตามที่ `sql/add_chairman_sign_statuses.sql` (มีอยู่แล้วใน
branch นี้ตั้งแต่ก่อนหน้า) อ้างว่าเพิ่มไปแล้ว** — นั่นคือ migration นั้นไม่เคยถูกรันจริงกับ Supabase
เขียน `sql/add_missing_trr_status_codes_2026-09-14.sql` แทนที่ ครอบคลุมทั้ง code ที่ขาดอยู่เดิม
(`021`, `117`, `118`, `119`) และ code ใหม่จากงานนี้ (`120`, `121`) ไว้ในไฟล์เดียว

## Verification
- `npm run sync` + `npm test` (CI 5/5) ผ่าน
- `affairs-644-opinion.html` เปิดด้วยเคสจริง (2005/2569) เรนเดอร์ถูกต้อง ไม่มี console error
- ไม่สามารถทดสอบ cross-page navigation จริงจนจบ flow ได้ (ติด DB constraint ข้างต้น) — ตรวจโค้ดละเอียด
  แทน โดยใช้ pattern เดียวกับหน้า dir-case-*.html ที่ทดสอบผ่านจริงแล้วก่อนหน้านี้ในวันเดียวกัน
