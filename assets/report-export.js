/**
 * ============================================================================
 * E-CMIS Report Export — ส่งออกข้อมูลเป็นไฟล์จริง Word (.docx) / Excel (.xlsx) / PDF (.pdf)
 * ============================================================================
 * Activity 7 — TOR ข้อ ๗.๔: "ส่งออก (Export) ข้อมูลการพิจารณาของคณะกรรมการ ป.ป.ท. ในรูปแบบ Word, Excel, PDF"
 * ดู docs/memory/plans/2026-09-30-tor-7-4-dashboard-export.md
 *
 * รูปแบบข้อมูลเข้า (def):
 *   {
 *     title:    'ชื่อรายงาน',
 *     subtitle: 'บรรทัดรอง (เช่น รอบเดือน/ปีงบประมาณ)',
 *     meta:     [['หัวข้อ', 'ค่า'], ...],                       // แสดงใต้หัวเรื่อง (ไม่บังคับ)
 *     sections: [{ title, head:[...], rows:[[...]], colWidths:[...], boldRows:[index,...] }],
 *     filename: 'ชื่อไฟล์ (ไม่ต้องมีนามสกุล)',
 *     landscape: true
 *   }
 * แต่ละฟังก์ชัน export* ดาวน์โหลดไฟล์ทันที ส่วน build*Blob คืน Blob (ใช้ทดสอบ/ส่งต่อ)
 * ไลบรารีโหลดเมื่อใช้งานครั้งแรก: SheetJS (xlsx) จาก cdnjs, PizZip (สร้าง .docx จริง) จาก jsDelivr, html2pdf จาก assets/
 * ============================================================================
 */
(function (global) {
  'use strict';

  const XLSX_URL = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  const PIZZIP_URL = 'https://cdn.jsdelivr.net/npm/pizzip@3/dist/pizzip.js';
  const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  const loading = {};
  function loadScript(url) {
    if (loading[url]) return loading[url];
    loading[url] = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = url;
      s.onload = () => resolve();
      s.onerror = () => { delete loading[url]; reject(new Error('โหลดไลบรารีไม่สำเร็จ: ' + url)); };
      document.head.appendChild(s);
    });
    return loading[url];
  }

  function inResFolder() { return (global.location && global.location.pathname || '').includes('/res/'); }
  function localAsset(name) { return (inResFolder() ? '../assets/' : 'assets/') + name; }

  function stamp() {
    const d = new Date();
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear() + 543}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
  }
  function safeName(name) { return String(name || 'รายงาน').replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '_'); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  function download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);
  }
  function toast(ok, msg) {
    const E = global.ECMIS;
    if (E && (ok ? E.toastOk : E.toastWarn)) (ok ? E.toastOk : E.toastWarn)(msg);
  }

  // ---------------------------------------------------------------- XLSX (.xlsx จริง ผ่าน SheetJS)
  async function buildXlsxBlob(def) {
    await loadScript(XLSX_URL);
    const XLSX = global.XLSX;
    const wb = XLSX.utils.book_new();
    const used = new Set();
    (def.sections || []).forEach((sec, idx) => {
      const aoa = [];
      if (idx === 0 || sec.repeatTitle) {
        aoa.push([def.title || '']);
        if (def.subtitle) aoa.push([def.subtitle]);
        (def.meta || []).forEach(m => aoa.push([m[0], m[1]]));
        aoa.push([]);
      }
      if (sec.title) aoa.push([sec.title]);
      aoa.push(sec.head || []);
      (sec.rows || []).forEach(r => aoa.push(r));
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      const cols = sec.colWidths || (sec.head || []).map((h, i) => {
        const longest = Math.max(String(h || '').length, ...((sec.rows || []).map(r => String(r[i] == null ? '' : r[i]).length)));
        return Math.min(60, Math.max(10, longest + 2));
      });
      ws['!cols'] = cols.map(w => ({ wch: w }));
      let name = String(sec.sheetName || sec.title || ('แผ่นที่ ' + (idx + 1))).replace(/[\\/?*[\]:]/g, ' ').slice(0, 31);
      let n = name, k = 2;
      while (used.has(n)) { n = name.slice(0, 28) + ' ' + k++; }
      used.add(n);
      XLSX.utils.book_append_sheet(wb, ws, n);
    });
    const arr = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([arr], { type: XLSX_MIME });
  }

  // ---------------------------------------------------------------- DOCX (.docx จริง — OOXML ที่ประกอบด้วย PizZip)
  function xEsc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c])); }
  const FONT = '<w:rFonts w:ascii="TH Sarabun New" w:hAnsi="TH Sarabun New" w:cs="TH Sarabun New" w:eastAsia="TH Sarabun New"/>';
  function wr(text, o) {
    o = o || {};
    const sz = o.size || 28; // half-points (28 = 14pt)
    return `<w:r><w:rPr>${FONT}${o.bold ? '<w:b/><w:bCs/>' : ''}${o.color ? `<w:color w:val="${o.color}"/>` : ''}<w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/></w:rPr><w:t xml:space="preserve">${xEsc(text)}</w:t></w:r>`;
  }
  function para(text, o) {
    o = o || {};
    return `<w:p><w:pPr>${o.center ? '<w:jc w:val="center"/>' : ''}<w:spacing w:before="${o.before || 0}" w:after="${o.after == null ? 80 : o.after}"/></w:pPr>${text === '' ? '' : wr(text, o)}</w:p>`;
  }
  function cell(text, widthTw, o) {
    o = o || {};
    return `<w:tc><w:tcPr><w:tcW w:w="${widthTw}" w:type="dxa"/>${o.fill ? `<w:shd w:val="clear" w:color="auto" w:fill="${o.fill}"/>` : ''}</w:tcPr>` +
      `<w:p><w:pPr><w:spacing w:before="20" w:after="20"/>${o.center ? '<w:jc w:val="center"/>' : ''}${o.right ? '<w:jc w:val="right"/>' : ''}</w:pPr>${String(text) === '' ? '' : wr(text, { bold: o.bold, size: o.size || 24, color: o.color })}</w:p></w:tc>`;
  }
  function table(sec, totalTw) {
    const head = sec.head || [];
    const n = Math.max(head.length, ...((sec.rows || []).map(r => r.length)), 1);
    const weights = sec.colWidths && sec.colWidths.length === n ? sec.colWidths : Array(n).fill(1);
    const sum = weights.reduce((a, b) => a + b, 0);
    const ws = weights.map(w => Math.floor((w / sum) * totalTw));
    const bold = new Set(sec.boldRows || []);
    const borders = ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(b => `<w:${b} w:val="single" w:sz="4" w:space="0" w:color="808080"/>`).join('');
    let x = `<w:tbl><w:tblPr><w:tblW w:w="${totalTw}" w:type="dxa"/><w:tblBorders>${borders}</w:tblBorders><w:tblLayout w:type="fixed"/></w:tblPr><w:tblGrid>${ws.map(w => `<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>`;
    x += `<w:tr><w:trPr><w:tblHeader/></w:trPr>${head.map((h, i) => cell(h, ws[i], { fill: '1F3B73', bold: true, color: 'FFFFFF', center: true })).join('')}</w:tr>`;
    (sec.rows || []).forEach((r, ri) => {
      x += '<w:tr>' + Array.from({ length: n }, (_, i) => {
        const v = r[i] == null ? '' : r[i];
        const isNum = typeof v === 'number';
        return cell(v, ws[i], { bold: bold.has(ri), fill: bold.has(ri) ? 'E8EDF7' : '', right: isNum });
      }).join('') + '</w:tr>';
    });
    return x + '</w:tbl>';
  }
  async function buildDocxBlob(def) {
    await loadScript(PIZZIP_URL);
    const landscape = def.landscape !== false;
    const pageW = landscape ? 16838 : 11906, pageH = landscape ? 11906 : 16838, margin = 1134;
    const usable = pageW - margin * 2;
    let body = para(def.title || '', { bold: true, size: 36, center: true, after: 40 });
    if (def.subtitle) body += para(def.subtitle, { size: 28, center: true, after: 80 });
    (def.meta || []).forEach(m => { body += para(`${m[0]}: ${m[1]}`, { size: 24, after: 20 }); });
    (def.sections || []).forEach((sec, i) => {
      if (i > 0) body += '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
      if (sec.title) body += para(sec.title, { bold: true, size: 30, before: 120, after: 80 });
      body += table(sec, usable);
      body += para('', { after: 60 });
    });
    const doc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}` +
      `<w:sectPr><w:pgSz w:w="${pageW}" w:h="${pageH}"${landscape ? ' w:orient="landscape"' : ''}/><w:pgMar w:top="${margin}" w:right="${margin}" w:bottom="${margin}" w:left="${margin}" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`;
    const zip = new global.PizZip();
    zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
    zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
    zip.file('word/document.xml', doc);
    return zip.generate({ type: 'blob', mimeType: DOCX_MIME, compression: 'DEFLATE' });
  }

  // ---------------------------------------------------------------- PDF (.pdf จริง ผ่าน html2pdf ที่มากับโปรเจกต์)
  /* วิธีทำ: แบ่งตารางเป็น "หน้ากระดาษ A4" ทีละหน้าด้วยการวัดความสูงจริง แล้ว render ทีละหน้าเป็นภาพลง jsPDF
     (เดิมพยายาม render ทั้งเอกสารเป็น canvas ใบเดียว — ตารางยาวเกินขีดจำกัดขนาด canvas ของเบราว์เซอร์ ได้หน้าเปล่า)
     ข้อควรรู้: PDF ที่ได้เป็นภาพหน้ากระดาษ (เลือก/ค้นหาข้อความไม่ได้) — ใช้ Excel/Word เมื่อต้องการข้อมูลแบบข้อความ */
  const PAGE_MM = { landscape: [297, 210], portrait: [210, 297] };
  function pdfHeaderHtml(def) {
    return `<div style="text-align:center;font-size:19pt;font-weight:700;line-height:1.2">${esc(def.title || '')}</div>
      ${def.subtitle ? `<div style="text-align:center;font-size:13pt;margin-bottom:2mm">${esc(def.subtitle)}</div>` : ''}
      ${(def.meta || []).map(m => `<div style="font-size:10.5pt"><strong>${esc(m[0])}:</strong> ${esc(m[1])}</div>`).join('')}`;
  }
  /* html2canvas วาดข้อความไทยที่ "ตัดบรรทัดอัตโนมัติ" คลาดจากที่เบราว์เซอร์จัดวางจริง (ข้อความซ้อนกัน) —
     จึงตัดบรรทัดเองด้วยการวัดความกว้างจริง (canvas measureText + Intl.Segmenter แยกคำไทย) แล้วใส่ <br> ชัดเจน
     ให้ทุกบรรทัดพอดีคอลัมน์และไม่มีการตัดบรรทัดอัตโนมัติอีก */
  let _measure = null;
  const _seg = (typeof Intl !== 'undefined' && Intl.Segmenter) ? new Intl.Segmenter('th', { granularity: 'word' }) : null;
  function measureCtx(fontPx, bold) {
    if (!_measure) _measure = document.createElement('canvas').getContext('2d');
    _measure.font = `${bold ? '700 ' : ''}${fontPx}px Sarabun, "TH Sarabun New", sans-serif`;
    return _measure;
  }
  function wrapCell(text, maxPx, fontPx, bold) {
    const ctx = measureCtx(fontPx, bold);
    const out = [];
    String(text == null ? '' : text).split(/\r?\n/).forEach(par => {
      const tokens = _seg ? Array.from(_seg.segment(par), x => x.segment) : Array.from(par);
      let line = '';
      tokens.forEach(tok => {
        if (line && ctx.measureText(line + tok).width > maxPx) { out.push(line.replace(/\s+$/, '')); line = tok.replace(/^\s+/, ''); }
        else line += tok;
        // คำเดี่ยวที่ยาวเกินคอลัมน์ (เช่นเลขบัตร) — ตัดตามตัวอักษร
        while (ctx.measureText(line).width > maxPx && line.length > 1) {
          let k = line.length - 1;
          while (k > 1 && ctx.measureText(line.slice(0, k)).width > maxPx) k--;
          out.push(line.slice(0, k)); line = line.slice(k);
        }
      });
      out.push(line);
    });
    return out;
  }
  function pdfRowHtml(r, isBold, colPx, fontPx) {
    return `<tr style="${isBold ? 'font-weight:700;background:#E8EDF7' : ''}">${r.map((v, ci) => {
      const isNum = typeof v === 'number';
      const lines = isNum ? [String(v)] : wrapCell(v, Math.max(20, colPx[ci] - 10), fontPx, isBold);
      return `<td style="border:1px solid #808080;padding:2px 4px;vertical-align:top;white-space:nowrap;${isNum ? 'text-align:right' : ''}">${lines.map(esc).join('<br>')}</td>`;
    }).join('')}</tr>`;
  }
  function pdfHeadRowHtml(head) {
    return `<tr>${head.map(h => `<th style="border:1px solid #808080;background:#1F3B73;color:#fff;padding:2px 4px;text-align:center;vertical-align:middle">${esc(h)}</th>`).join('')}</tr>`;
  }
  /** แบ่งหน้าโดยวัดความสูงจริงของ DOM — คืนรายการ element หน้ากระดาษ (อยู่ใน host แล้ว) */
  function paginateForPdf(def, host) {
    const landscape = def.landscape !== false;
    const [wmm, hmm] = PAGE_MM[landscape ? 'landscape' : 'portrait'];
    const pages = [];
    const newPage = (headerHtml, secTitle, head, fontPt) => {
      const el = document.createElement('div');
      el.className = 'rx-pdf';
      el.style.cssText = `width:${wmm}mm;height:${hmm}mm;box-sizing:border-box;padding:9mm 10mm;overflow:hidden;background:#fff;color:#000;` +
        `font-family:'Sarabun','TH Sarabun New',sans-serif;letter-spacing:0;position:relative`;
      el.innerHTML = `${headerHtml || ''}${secTitle ? `<h3 style="font-size:13pt;margin:3mm 0 2mm;font-weight:700">${esc(secTitle)}</h3>` : ''}` +
        `<table style="border-collapse:collapse;width:100%;font-size:${fontPt}pt;table-layout:fixed"><thead>${pdfHeadRowHtml(head)}</thead><tbody></tbody></table>` +
        `<div class="rx-pgno" style="position:absolute;right:10mm;bottom:4mm;font-size:9pt;color:#555"></div>`;
      host.appendChild(el);
      pages.push(el);
      return el;
    };
    const overflow = el => el.scrollHeight > el.clientHeight + 1;
    (def.sections || []).forEach((secFull, si) => {
      // pdfCols: เลือกเฉพาะคอลัมน์สำคัญสำหรับ PDF (ตารางกว้างเกินไปอ่านไม่ออกบนกระดาษ A4) — Word/Excel ยังได้ครบทุกคอลัมน์
      const cols = secFull.pdfCols;
      const sec = cols ? Object.assign({}, secFull, {
        head: cols.map(i => (secFull.head || [])[i]),
        rows: (secFull.rows || []).map(r => cols.map(i => r[i])),
        colWidths: secFull.pdfColWidths || cols.map(() => 1)
      }) : secFull;
      const head = sec.head || [];
      const n = Math.max(head.length, 1);
      const fontPt = n > 9 ? 8 : (n > 5 ? 9.5 : 11);
      const weights = sec.colWidths && sec.colWidths.length === n ? sec.colWidths : Array(n).fill(1);
      const sum = weights.reduce((a, b) => a + b, 0);
      const innerPx = (wmm - 20) * 3.7795;
      const colPx = weights.map(w => (w / sum) * innerPx);
      const fontPx = fontPt * 1.3333;
      const colgroup = `<colgroup>${weights.map(w => `<col style="width:${(w / sum * 100).toFixed(2)}%">`).join('')}</colgroup>`;
      const bold = new Set(sec.boldRows || []);
      let el = newPage(si === 0 ? pdfHeaderHtml(def) : '', sec.title, head, fontPt);
      el.querySelector('table').insertAdjacentHTML('afterbegin', colgroup);
      let tb = el.querySelector('tbody');
      (sec.rows || []).forEach((r, ri) => {
        tb.insertAdjacentHTML('beforeend', pdfRowHtml(r, bold.has(ri), colPx, fontPx));
        if (overflow(el) && tb.rows.length > 1) {
          const last = tb.rows[tb.rows.length - 1];
          last.parentNode.removeChild(last);
          el = newPage('', sec.title ? sec.title + ' (ต่อ)' : '', head, fontPt);
          el.querySelector('table').insertAdjacentHTML('afterbegin', colgroup);
          tb = el.querySelector('tbody');
          tb.insertAdjacentHTML('beforeend', pdfRowHtml(r, bold.has(ri), colPx, fontPx));
        }
      });
    });
    pages.forEach((p, i) => { p.querySelector('.rx-pgno').textContent = `หน้า ${i + 1} / ${pages.length}`; });
    return { pages, wmm, hmm, landscape };
  }
  async function ensureHtml2pdf() {
    if (typeof global.html2pdf === 'undefined') await loadScript(localAsset('html2pdf.bundle.min.js'));
    if (typeof global.html2pdf === 'undefined') throw new Error('โหลด html2pdf ไม่สำเร็จ');
  }
  async function buildPdfBlob(def) {
    await ensureHtml2pdf();
    try { await document.fonts.load('16px Sarabun'); await document.fonts.load('700 16px Sarabun'); await document.fonts.ready; } catch (e) { /* ใช้ฟอนต์สำรอง */ }
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;left:-20000px;top:0;z-index:-1';
    const st = document.createElement('style');
    /* สำคัญ: สไตล์ของเว็บตั้ง letter-spacing ≠ 0 ทำให้ html2canvas วาดทีละตัวอักษรและวรรณยุกต์ไทยเพี้ยน — บังคับเป็น 0 ทั้งกล่อง */
    st.textContent = '.rx-pdf, .rx-pdf * { letter-spacing: 0 !important; }';
    host.appendChild(st);
    document.body.appendChild(host);
    try {
      const { pages, wmm, hmm, landscape } = paginateForPdf(def, host);
      const opt = {
        margin: 0, image: { type: 'jpeg', quality: 0.92 },
        html2canvas: { scale: 2, useCORS: true, logging: false, scrollX: 0, scrollY: 0 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: landscape ? 'landscape' : 'portrait' }
      };
      // jsPDF จาก html2pdf: สร้างเอกสารจากกล่องเล็ก ๆ ก่อน (1 หน้า) แล้วเพิ่มหน้าจริงทีละหน้า สุดท้ายลบหน้าแรกที่เป็นตัวตั้งต้น
      const seed = document.createElement('div');
      seed.style.cssText = 'width:10mm;height:10mm';
      host.appendChild(seed);
      const pdf = await global.html2pdf().set(opt).from(seed).toPdf().get('pdf');
      for (let i = 0; i < pages.length; i++) {
        const canvas = await global.html2pdf().set(opt).from(pages[i]).toCanvas().get('canvas');
        pdf.addPage([wmm, hmm], landscape ? 'landscape' : 'portrait');
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, wmm, hmm);
      }
      pdf.deletePage(1);
      return pdf.output('blob');
    } finally {
      document.body.removeChild(host);
    }
  }

  // ---------------------------------------------------------------- ปุ่มใช้งาน: สร้างไฟล์ + ดาวน์โหลด
  async function doExport(kind, def) {
    const base = `${safeName(def.filename || def.title)}_${stamp()}`;
    try {
      toast(true, 'กำลังสร้างไฟล์ ' + kind.toUpperCase() + ' กรุณารอสักครู่...');
      let blob, ext;
      if (kind === 'xlsx') { blob = await buildXlsxBlob(def); ext = 'xlsx'; }
      else if (kind === 'docx') { blob = await buildDocxBlob(def); ext = 'docx'; }
      else { blob = await buildPdfBlob(def); ext = 'pdf'; }
      download(blob, `${base}.${ext}`);
      toast(true, `ดาวน์โหลด ${base}.${ext} เรียบร้อยแล้ว`);
      return blob;
    } catch (err) {
      console.error('[ReportExport]', kind, err);
      toast(false, `สร้างไฟล์ ${kind.toUpperCase()} ไม่สำเร็จ: ${err.message || err}`);
      return null;
    }
  }

  global.ReportExport = {
    buildXlsxBlob, buildDocxBlob, buildPdfBlob,
    exportXlsx: def => doExport('xlsx', def),
    exportDocx: def => doExport('docx', def),
    exportPdf: def => doExport('pdf', def)
  };
})(typeof window !== 'undefined' ? window : this);
