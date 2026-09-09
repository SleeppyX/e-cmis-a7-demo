# แผนงาน: คีย์ลัดเติมข้อความมาตรา (ghost autocomplete) ใน ruling-report.html

**วันที่:** 2026-09-09
**Branch:** main (local, ไม่ push)
**ประเภท:** feature — UI/UX ช่วยพิมพ์ในหน้ารายงานวินิจฉัยชี้มูล (ปปท. 7-02)

## 1. โจทย์

ใน `ruling-report.html` textarea เขียนอิสระ: เมื่อพิมพ์ `มาตรา ๑๔๗` ให้ระบบ
แสดง "คำต่อ" (ข้อความฐานความผิดเต็ม) เป็น ghost แล้วกด **Tab** = เติมข้อความนั้นลงช่อง

ตัวอย่าง: พิมพ์ `มาตรา ๑๔๗` + Tab →
`มาตรา ๑๔๗ ฐานเป็นเจ้าพนักงาน มีหน้าที่จัดการหรือดูแลกิจการใด เข้ามีส่วนได้เสียเพื่อประโยชน์สำหรับ หรือผู้อื่นเนื่องด้วยกิจการนั้น`

## 2. การตัดสินใจ (จาก /grill-me 3 รอบ)

| # | เรื่อง | สรุป |
|---|---|---|
| Q1 | corpus | ผู้ใช้ส่งเอง 4 มาตรา (๑๔๗/๑๕๒/๑๕๗/๒๖๔) เก็บ **verbatim** — ถ้อยคำต่างจาก ป.อาญา ทางการ ผู้ใช้รับทราบ (demo) |
| Q2 | ขอบเขตช่อง | ทุก `<textarea>` ในหน้า ยกเว้นที่มี `data-no-suggestions` (legalAnalysis, modalTextarea) |
| Q3 | จับคู่เลข | เฉพาะเลขตรงเป๊ะ, normalize ไทย/อารบิก, ไม่มีโหมด prefix/dropdown |
| Q4 | กลไก ghost | **native selection-range trick** (แทรกข้อความต่อท้าย caret แล้ว select ไว้) |
| Q5 | trigger | อัตโนมัติหลัง `input` เมื่อข้อความก่อน caret ลงท้าย `/มาตรา\s*([๐-๙0-9]+)$/` + เลขตรง key + ไม่มี selection + ตัวถัดไปเป็นท้าย/whitespace |
| Q6 | Tab | เขียนทับ token `มาตรา<sp>เลข` + ghost ครั้งเดียวเป็น canonical `มาตรา ๑๔๗ ` + clause (normalize เลข→ไทยตรงนี้) |
| Q7 | ตัวช่วยมองเห็น | tooltip เล็ก `⭾ Tab เพื่อเติมข้อความ มาตรา ๑๔๗` ใต้ช่อง ขณะ ghost active |
| Q8 | กัน ghost ถูกเซฟ | `clearActiveGhost()` ที่ต้น `persistForm` / `renderDoc` + capture-phase `input` (ก่อน listener หน้า) + blur/pointerdown/scroll/Esc/ปุ่มอื่น |
| Q9 | ที่เก็บ map | `const MATRA_CONTINUATION` ใน `<script>` ของ `ruling-report.html` → `npm run sync` ไป `res/` |

## 3. การเปลี่ยนแปลง (ruling-report.html + res/)

1. **CSS** (บล็อก `<style>` ~บรรทัด 240): เพิ่ม `.matra-ghost-hint` + `.matra-ghost-hint kbd`
2. **const** ใกล้ `BOARD` (~บรรทัด 595): เพิ่ม `MATRA_CONTINUATION` (4 entry, key = เลขอารบิก string)
3. **`persistForm()`** (~1496) + **`renderDoc()`** (~1520): เพิ่ม `clearActiveGhost();` บรรทัดแรก
4. **ท้าย `<script>`** (ก่อน IIFE `initOffenseBasis`): เพิ่มโมดูล
   - `MATRA_GHOST` tracker `{el,start,end,text}`
   - `_matraDigitsToArabic` / `_matraDigitsToThai`
   - `clearActiveGhost()` — ลบ ghost เฉพาะเมื่อ `value.slice(start,end) === text` (ไม่งั้น bail ไม่แตะข้อความผู้ใช้)
   - `_matraTryGhost(el)` — ตรวจ pattern + แทรก selection + เรียก hint
   - `_matraCommitGhost()` — Tab: หา token ย้อน, เขียนทับ canonical, ยิง `input` event
   - `_matraShowHint` / `_matraHideHint`
   - `initMatraAutocomplete()` — `input`(capture) + `keydown`(capture, Tab/Esc/ปุ่มอื่น) + `pointerdown`/`blur`/`scroll`(capture) ; เรียกครั้งเดียวตอนโหลด

## 4. ไม่แตะ

`initWritingSuggestions` (ระบบ suggestions กลาง, ถูก CSS ซ่อนอยู่แล้ว), `#offenseSearch` typeahead,
`COMPREHENSIVE_OFFENSE_BASIS`, state machine / TRANSITIONS / STATUS, RBAC, a4 layout / paginateDoc

## 5. ทดสอบ

- `npm run sync` → root/res ตรงกัน (CI layer 2)
- `npm test` (5 ด่าน) + `npm run test:integration` (60 assertions)
- Chrome (role ที่เข้าถึง ruling-report เช่น board_sec / subcommittee):
  - พิมพ์ `มาตรา ๑๔๗` → ghost + tooltip → Tab → ข้อความเต็ม, caret ท้าย
  - พิมพ์ `มาตรา 264` (อารบิก) → Tab → `มาตรา ๒๖๔ ฐานปลอม...`
  - `มาตรา ๙๙๙` → ไม่มี ghost
  - Esc / พิมพ์ต่อ / คลิกที่อื่น → ghost หาย ไม่ทิ้งข้อความค้าง
  - กดบันทึกขณะ ghost ค้าง → ค่าที่เซฟไม่มี ghost
  - ช่อง `legalAnalysis` / modal → ไม่มี ghost
  - ไม่มี console error

## 6. ข้อจำกัดที่ทราบ (known limitations)

1. **Undo (Ctrl+Z) ในช่องที่ ghost ทำงานถูกล้าง** — กลไกเขียน `el.value` ตรง ๆ ทั้งตอนแทรก/ลบ
   ghost ทำให้ undo stack ของ textarea นั้นหาย. เป็น tradeoff ของวิธี native selection-range
   ที่เลือกไว้ (Q4). ระบุไว้เป็น comment ในโค้ด (`clearActiveGhost` / `_matraTryGhost`).
2. **Cascade กันแล้ว** — flag `_matraSuppressNext` ข้าม auto-ghost 1 tick หลังกด Tab commit
   → clause ที่ลงท้ายด้วย "มาตรา <เลข>" จะไม่ auto-trigger ghost อันที่สองทันที
   (ผู้ใช้ยังพิมพ์ต่อเพื่อ trigger เองได้ตามปกติ).
3. **ไม่แก้ (impact ต่ำมาก):** Ctrl+C/Ctrl+A ขณะ ghost active จะยกเลิก ghost แทน copy/select ·
   `scroll` capture listener กว้าง (เลื่อน pane พรีวิวก็ยกเลิก ghost) · `stopPropagation()` บน Tab

## 7. Commit

`feat(ruling-report): คีย์ลัดเติมข้อความฐานความผิดตามเลขมาตรา (พิมพ์ "มาตรา ๑๔๗" + Tab)`
บน `main` local — ไม่ push (amend `71211c8` รวม review fix #1/#2). Log: Code history 2026-09-09 + Prompt history Task 98
