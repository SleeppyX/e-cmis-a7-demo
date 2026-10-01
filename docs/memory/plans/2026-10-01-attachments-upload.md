# อัปโหลดเอกสารเพิ่มเติม (Word / Excel / PDF) ทุกหน้า preview เอกสารระดับสำนวน

**สถานะ:** Completed (ยกเว้นปุ่มลบ — รอ DBA เพิ่ม policy)

## ตัดสินใจ (AskUserQuestion 2026-10-01)
- ผู้ที่ดำเนินการได้ในขั้นนั้น (ECMIS.canAct) อัปโหลดได้ คนอื่นเห็นเฉพาะรายการ
- ลบได้เฉพาะไฟล์ที่บทบาทตัวเองอัปโหลดและยังอยู่ในขั้นเดียวกัน (soft-delete)
- การ์ดใหม่ในคอลัมน์ซ้าย ต่อจากการ์ดสรุปสำนวน
- หน้าระดับ "การประชุม" (meeting-docs, agenda-meeting-docs, board-detail, meeting-report) ยังไม่ทำ
- ขนาด ≤ 10 MB/ไฟล์, นามสกุล .doc .docx .xls .xlsx .pdf

## ที่ทำ
- `assets/ecmis-app.js`: `ECMIS.initAttachmentCard()` + auto-mount (หน้าที่มี #docWorkspace และ ?case=…) ใช้ Storage bucket `case-documents` + `tbl_res_attachment` เดิม
  path = `<tcc_id>/<รหัสสถานะ>/<ts>_<สุ่ม>.<ext>` (ASCII; ชื่อไทยเก็บใน trat_filename; รหัสสถานะ = ขั้นที่อัป)
- หน้าที่มีการ์ดไฟล์แนบเดิม (`#attachmentCard` ของ approval-review/review เคสด่วน) ไม่ใส่ซ้ำ
- สำนวนจำลองที่ไม่มีใน DB ไม่แสดงการ์ด

## ข้อจำกัดที่พบ
`tbl_res_attachment` ไม่มี RLS policy สำหรับ UPDATE → soft-delete (is_deleted=true) ด้วย anon key ได้ 200/[] ไม่เปลี่ยนแถว
จึงตั้ง `ATTACH_DELETE_ENABLED = false` (ซ่อนปุ่มลบ) ให้ DBA รัน SQL ด้านล่าง แล้วเปลี่ยนค่าเป็น `true`:

```sql
create policy "attachment_soft_delete" on public.tbl_res_attachment
  for update to anon using (true) with check (true);
```
(เดโมใช้ anon key ทั้งระบบ — ถ้าต้องการจำกัดกว่านี้ให้ปรับเงื่อนไข)

## อัปเดต 2026-10-01 (ต้นแบบแบบทันสมัย — affairs-case-detail, chairman-agenda)
- หน้าตาตามภาพอ้างอิงผู้ใช้: กล่องลากวางแนวนอน + ปุ่มอัปโหลด, แถบสรุป "อัปโหลดแล้ว x จาก y ไฟล์", แถวคิวพร้อมแถบความคืบหน้า/ยกเลิก
- รายการไฟล์ในการ์ด **มีแค่ปุ่มลบ** (ไม่มีดู/ดาวน์โหลด) — เฉพาะไฟล์ที่บทบาทตัวเองอัปในขั้นเดียวกัน
- `ATTACH_DELETE_ENABLED = true` แล้ว: ถ้า DB ยังไม่มี policy จะแจ้ง "ฐานข้อมูลยังไม่เปิดสิทธิ์ลบไฟล์แนบ" — ใช้ได้จริงทันทีที่ DBA รัน SQL ด้านบน
- 2026-10-01: policy UPDATE ถูกเพิ่มใน DB แล้ว — ปุ่มลบใช้ได้จริง (ทดสอบลบไฟล์ทดสอบสำเร็จ)
- คิวอัปโหลด: ไฟล์สำเร็จโชว์ ✓ ~1.5 วิ แล้วจางหาย, ไฟล์ไม่สำเร็จค้างพร้อมเหตุผลจนกด ×, ส่วนคิวหายเมื่อไม่เหลือแถว
- 2026-10-01: ผู้ใช้ยืนยัน → ใช้หน้าตาใหม่ทุกหน้า (ลบโค้ดแบบเดิม, `initAttachmentCard` = แบบใหม่, ตัด ATTACH_MODERN_PAGES) ตรวจ 19 หน้าการ์ดใหม่ขึ้นครบ ไม่มี JS error
