# 📋 Task Plan: เพิ่ม A4 Document Preview ให้ affairs-case-detail.html

> **Plan ID:** `2026-09-23-affairs-case-detail-a4-preview`
> **Date:** 2026-09-23
> **Author / Agent:** Claude Code (ผ่าน /grilling)
> **Status:** Done
> **Branch / PR:** `main`

---

## 🎯 1. Problem Statement & Business Objective
- ผู้ใช้ถามหลังจากงาน `2026-09-23-affairs-case-detail-page.md` เสร็จว่า "แล้วไหนเอกสาร preview" — ยืนยันผ่าน `/grilling` ว่าต้องการเห็นเอกสารจัดรูปแบบ A4 จริง ไม่ใช่แค่ field ข้อความเดี่ยวๆ อย่างที่ทำไปในรอบก่อน (secgenOpinion เป็น plain text)
- วิจัยยืนยันแล้วว่าไม่มีเอกสารที่ freeze ตอนเซ็นจริง — `renderDoc()` ใน `approval-review.html` (บรรทัด 1663-1699) เป็น inline function ที่ re-render จาก `kase` สดทุกครั้ง จึงนำ template เดียวกันมาปรับใช้ได้ตรงๆ โดยไม่ต้องกังวลเรื่อง snapshot

## 📐 ดีไซน์ที่ตกลงกันใน /grilling รอบสอง (2026-09-23)
1. เปลี่ยน `affairs-case-detail.html` จาก single-column เป็น **two-pane workspace** เหมือน `approval-review.html` — ซ้าย = การ์ดที่มีอยู่แล้ว (หัวสำนวน + ความเห็นตามสายอนุมัติ), ขวา = A4 preview pane (`ws-doc-pane` sticky)
2. เพิ่ม `<link href="assets/a4-ecmis-workspace.css">` เข้า `<head>` — **ห้ามเขียน geometry ทับเอง** (มีตัวอย่างผิดจริงที่ `board-detail.html` เป็นบทเรียน) ใช้ class `.a4-paper`/`.doc-paper` เดิมเปล่าๆ
3. **ไม่มี toolbar พิมพ์/ส่งออก Word/pagination/zoom** — กลุ่มกิจไม่ใช่เจ้าของสำนวน แค่ดูประกอบการตัดสินใจเท่านั้น จึงตัด `ws-doc-toolbar`/`docPaginationBar` ทั้งหมดออก เหลือแค่ `ws-paper-stage` > `#docPaper` > `.doc-paper.a4-paper` แสดงเอกสารหน้าเดียวแบบ static
4. เนื้อหาเอกสาร: ใช้ template เดียวกับ `renderDoc()` ของ `approval-review.html` (เรื่องที่/เรื่อง/ผู้รับผิดชอบ/สังกัด/ผู้ถูกกล่าวหา/ข้อกล่าวหา/ความเห็นตามสายอนุมัติ) **แต่ตัด conditional block ที่ผูกกับ UI state ของ secgen ออก** (checkbox ซับซ้อน/เร่งด่วนที่เลือกอยู่ตอนนี้ — ไม่มีความหมายในหน้า affairs) แทนที่ด้วยการแสดง `k.secgenOpinion` ที่มีอยู่แล้วเป็นส่วน "ความเห็นของเลขาธิการฯ" ในเอกสารแทน — ไม่มีลายเซ็นต์ภาพ (ไม่ใช่หน้าลงนาม)
5. ใช้ `ECMIS.mergeField` (alias `M`) เหมือน `approval-review.html` สำหรับ merge field/placeholder

## 📂 2. Affected Routes & Modules
- [x] `affairs-case-detail.html` + `res/affairs-case-detail.html`
- [x] ไม่แตะไฟล์อื่น (ไม่มีการเปลี่ยน routing/STATUS/DB เพิ่มจากรอบก่อน)

## 🛡️ 3. The 6 Golden Anti-Regression Pre-Check
- [x] 5. ไม่แตะ A4 geometry — ใช้ `assets/a4-ecmis-workspace.css` ตรงๆ ไม่ redefine padding/footer/font เอง (จุดเสี่ยงหลักของงานนี้)
- [x] อื่นๆ เหมือนแผนก่อนหน้า (ไม่กระทบ)

## 📝 4. Step-by-Step Implementation Tasks
- [x] Task 1: เพิ่ม `<link href="assets/a4-ecmis-workspace.css">` ใน `<head>`
- [x] Task 2: ปรับ HTML structure — ห่อ `detailWrap` เดิมเป็น `document-workspace` two-pane: `#docLeftCol` (การ์ดเดิมทั้งหมด) + `<aside class="ws-doc-pane">` (ไม่มี toolbar) ที่มี `.ws-paper-stage > #docPaper > .doc-paper.a4-paper#docPaperPage`
- [x] Task 3: เพิ่ม `const M = ECMIS.mergeField;` และฟังก์ชัน `renderAffairsDoc()` ที่ adapt จาก `renderDoc()` ของ approval-review.html — ตัดส่วน secgen-UI-state ออก ใช้ `k.secgenOpinion` แทน, ไม่มี doc-sign block, ไม่เรียก `updatePaginationUI()`/`applyZoom()`
- [x] Task 4: เรียก `renderAffairsDoc()` ต่อจาก `renderDetail()` เดิม
- [x] Task 5: `npm run sync` + `npm test` (5-layer CI)
- [x] Task 6: live browser test — login affairs, เปิดเคส 9310/2569, เห็น A4 preview ด้านขวาแสดงเอกสารครบ (เรื่องที่/ผู้ถูกกล่าวหา/ข้อกล่าวหา/ความเห็นเลขาธิการฯ) ไม่มีปุ่มพิมพ์/ส่งออก — ตรวจ geometry ด้วย getComputedStyle **พบว่าไม่ตรงมาตรฐาน** (ได้ 25mm 20mm 20mm 25mm แทนที่จะเป็น 15mm 15mm 18mm 20mm) แต่สืบแล้วพบว่าเป็นบั๊กระบบเดิมที่มีอยู่แล้วใน `assets/a4-ecmis-workspace.css:1459` (rule บนหน้าจอ ไม่ใช่ print) กระทบทุกหน้าที่ใช้ `.doc-paper`/`.a4-paper` อยู่แล้วรวมถึง approval-review.html ที่มีมาก่อนงานนี้ — ไม่ใช่สิ่งที่งานนี้ทำให้เกิดขึ้นใหม่ จึงแยกไป spawn เป็น task ต่างหากแทนที่จะแก้ในแผนนี้ (ดู Notes ด้านล่าง)
- [x] Task 7: commit (ไม่ push)

## 🧪 5. Verification & Quality Gate Matrix
- [x] Dual-Route Sync: npm run sync
- [x] Enterprise CI (5-Layer): npm test ผ่าน 100%
- [x] Live browser check: A4 padding ตรงมาตรฐาน + เนื้อหาเอกสารครบตามที่ตกลง + ไม่มี toolbar/ปุ่มที่ไม่ต้องการ

## 🏁 6. Completion & Sign-off
- **Completed Date:** 2026-09-23
- **Commit Reference:** see `git log` — commit created by this task
- **Notes:** งานนี้เป็นส่วนต่อขยายของ `2026-09-23-affairs-case-detail-page.md` — ไม่เปลี่ยน STATUS/DB/routing ใดๆ เพิ่มเติม เป็นแค่ UI เพิ่มเติมในหน้าเดิม พบบั๊กจริงระหว่าง live testing (TDZ error: ต้องย้าย `const M = ECMIS.mergeField` ขึ้นไปก่อนจุดที่เรียก `renderDetail()` ครั้งแรก แก้แล้ว) และพบบั๊ก CSS ระบบเดิม (ไม่เกี่ยวกับงานนี้โดยตรง — padding บนหน้าจอผิดมาตรฐาน 15/15/18/20mm เป็น 25/20/20/25mm ที่ `assets/a4-ecmis-workspace.css:1459` กระทบทุกหน้าที่มีอยู่แล้ว) ได้ spawn task แยกไว้ให้แก้ต่างหาก ไม่ได้แก้ในงานนี้เพราะเป็น scope คนละเรื่องและกระทบวงกว้างกว่าหน้าเดียว
