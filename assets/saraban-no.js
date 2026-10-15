/* ============================================================
   saraban-no.js — เลขสารบรรณของเอกสารกิจกรรมที่ 7 (Task 300)
   ------------------------------------------------------------
   ต่อยอดแนวคิด nextControlSeq() ของ dir-case-support-assign.html:
   ลำดับถัดไป = เลขสูงสุดของ prefix + ปี พ.ศ. ที่มีอยู่ใน Supabase + 1

   ที่เก็บ: tbl_res_request.trr_resolution_data.sarabanNos[slot]
     { no, prefix, seq, year, issuedAt, issuedBy, issuedByName, manual, group, history[] }
   - no เก็บเป็นเลขอารบิก ("ปป 0004/0012/2569") — เอกสารแสดงเป็นเลขไทยด้วย sarabanThai()
   - เลขที่พิมพ์เองก็บันทึกเป็น record (manual: true) และนับรวมตอนหาลำดับถัดไปถ้ารูปแบบตรง
   - group: เอกสารที่ใช้เลขเดียวร่วมหลายเคส (รายงานการประชุม) เขียน record เดียวกันลงทุกเคส

   กันเลขซ้ำ (ไม่มีตารางตัวนับ): บันทึกแล้วอ่านซ้ำ ถ้ามีเอกสารอื่นได้ลำดับเดียวกันก่อนหน้า
   (issuedAt เก่ากว่า) ให้ฝั่งนี้ขยับไปเลขถัดไป — กดต่อเนื่องจากหลายแท็บไม่ซ้ำ
   ============================================================ */
(function (root) {
  'use strict';

  const E = () => root.ECMIS;
  const ROW_PAGE = 1000;

  /* Task 327: สวิตช์กลาง — ซ่อนช่อง/ปุ่มเลขสารบรรณบนเว็บไว้ก่อน (true = เปิดใช้ตามเดิม)
     ปิดอยู่: ไม่สร้างปุ่ม "ขอเลขสารบรรณ" และบรรทัดผู้ออกเลข, ช่องที่ Task 300 เพิ่ม (host) และการ์ด/แถว
     ของเลขสารบรรณถูกซ่อน · ช่องเดิมของหน้า (input เช่น เลขที่คำสั่ง) ยังกรอกได้ตามปกติ
     ข้อมูล sarabanNos ที่เคยออกไว้ไม่ถูกลบ และเอกสารยังแสดงเลขเหมือนเดิม */
  const SARABAN_UI_ENABLED = false;
  const SARABAN_UI_CONTAINERS = ['#resNotifyNoCard', '#notifyNo72Card', '#minutesNoRow', '#orderNotifyLetterBox',
    '#rulingReportNoBox', '#disciplineLetterNoBox', '#supportMemoNoBox', '#screeningMemoNoBox'];
  if (!SARABAN_UI_ENABLED && typeof document !== 'undefined' && !document.getElementById('sarabanOffStyle')) {
    const st = document.createElement('style');
    st.id = 'sarabanOffStyle';
    st.textContent = `${SARABAN_UI_CONTAINERS.join(',')}{display:none !important}`;
    (document.head || document.documentElement).appendChild(st);
  }
  const MAX_ATTEMPTS = 6;
  const THAI_TO_ARABIC = { '๐': '0', '๑': '1', '๒': '2', '๓': '3', '๔': '4', '๕': '5', '๖': '6', '๗': '7', '๘': '8', '๙': '9' };

  /* ค่าเดิมก่อนมีระบบนี้ที่ใช้ prefix เดียวกัน — นับรวมเพื่อไม่ให้ออกเลขชนของเก่า */
  const LEGACY_KEYS = {
    '': rd => [rd.orderNo],
    'ปป 0004.3/': rd => [rd.discLetterNo72, rd.disciplinaryTrack72 && rd.disciplinaryTrack72.letterNo]
  };

  function toArabic(s) { return String(s == null ? '' : s).replace(/[๐-๙]/g, d => THAI_TO_ARABIC[d]); }
  function escRe(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  const THAI_MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  function shortThaiDate(isoBE) {
    const p = String(isoBE || '').split('-');
    return p.length === 3 ? `${Number(p[2])} ${THAI_MONTHS_SHORT[Number(p[1]) - 1] || ''} ${p[0]}` : '';
  }
  function currentYearBE() { return Number(String(E().fakeTodayIso()).slice(0, 4)); }

  function formatSarabanNo(prefix, seq, yearBE) {
    const s = prefix ? String(seq).padStart(4, '0') : String(seq);
    return `${prefix}${s}/${yearBE}`;
  }
  /* ลำดับจากเลขที่พิมพ์ ("ปป ๐๐๐๔/๐๐๑๒/๒๕๖๙" หรือแบบอารบิก) — ไม่ตรงรูปแบบ = null */
  function parseSarabanSeq(prefix, yearBE, no) {
    const m = toArabic(no).trim().match(new RegExp('^' + escRe(toArabic(prefix)) + '\\s*(\\d+)\\s*/\\s*(\\d{4})$'));
    if (!m) return null;
    if (yearBE && Number(m[2]) !== Number(yearBE)) return null;
    return { seq: Number(m[1]), year: Number(m[2]) };
  }
  function sarabanThai(no) { return no ? E().toThaiDigits(no) : ''; }
  function sarabanRecord(kase, slot) {
    const nos = (kase && kase.resolutionData && kase.resolutionData.sarabanNos) || {};
    return nos[slot] || null;
  }
  function sarabanNoOf(kase, slot) { const r = sarabanRecord(kase, slot); return (r && r.no) || ''; }

  async function loadRows(sb) {
    const rows = [];
    for (let from = 0; ; from += ROW_PAGE) {
      const { data, error } = await sb.from('tbl_res_request')
        .select('trr_id, trr_resolution_data').order('trr_id').range(from, from + ROW_PAGE - 1);
      if (error) throw error;
      rows.push(...(data || []));
      if (!data || data.length < ROW_PAGE) break;
    }
    return rows;
  }

  /* ทุกเลขของ prefix + ปี ที่ใช้ไปแล้ว: { seq, key, issuedAt } — key แยกเอกสาร (group หรือ trr_id + slot) */
  function usedSeqs(rows, prefix, yearBE) {
    const out = [];
    rows.forEach(row => {
      const rd = row.trr_resolution_data || {};
      Object.entries(rd.sarabanNos || {}).forEach(([slot, r]) => {
        if (!r || r.prefix !== prefix) return;
        const p = parseSarabanSeq(prefix, yearBE, r.no);
        if (!p) return;
        out.push({ seq: p.seq, key: r.group || `${row.trr_id}:${slot}`, issuedAt: r.issuedAt || '' });
      });
      (LEGACY_KEYS[prefix] ? LEGACY_KEYS[prefix](rd) : []).forEach(v => {
        const p = v && parseSarabanSeq(prefix, yearBE, v);
        if (p) out.push({ seq: p.seq, key: `${row.trr_id}:legacy`, issuedAt: '' });
      });
    });
    return out;
  }

  async function nextSarabanNo(prefix, yearBE, sb) {
    const client = sb || E().getSupabaseClient();
    const year = yearBE || currentYearBE();
    const seqs = usedSeqs(await loadRows(client), prefix, year).map(x => x.seq);
    const seq = (seqs.length ? Math.max(...seqs) : 0) + 1;
    return { seq, year, no: formatSarabanNo(prefix, seq, year) };
  }

  /* เขียน record ลงเคส — อ่านแถวล่าสุดก่อน merge เพื่อไม่ทับข้อมูลที่หน้าอื่นเพิ่งบันทึก */
  async function writeRecord(sb, kase, slot, record) {
    let base = kase.resolutionData || {};
    if (sb && kase.trr_id) {
      const { data, error } = await sb.from('tbl_res_request').select('trr_resolution_data').eq('trr_id', kase.trr_id).maybeSingle();
      if (error) throw error;
      base = (data && data.trr_resolution_data) || base;
    }
    const merged = Object.assign({}, base, { sarabanNos: Object.assign({}, base.sarabanNos || {}, { [slot]: record }) });
    if (sb && kase.trr_id) {
      const { error } = await sb.from('tbl_res_request').update({ trr_resolution_data: merged }).eq('trr_id', kase.trr_id);
      if (error) throw error;
    }
    kase.resolutionData = merged;
    const mem = (E().CASES || []).find(c => c.id === kase.id);
    if (mem) mem.resolutionData = merged;
  }

  function actor() {
    const role = E().currentRole ? E().currentRole() : null;
    return { issuedBy: role ? role.id : '', issuedByName: role ? (role.name || role.title || '') : '' };
  }

  /* ออกเลขใหม่ให้เอกสาร slot ของเคส (kases = หลายเคสที่ใช้เลขเดียวกัน, group = ชื่อกลุ่ม) */
  async function issueSarabanNo({ sb, kases, slot, prefix, group }) {
    const client = sb || E().getSupabaseClient();
    const list = (kases || []).filter(Boolean);
    if (!client || !list.length) throw new Error('ไม่พบฐานข้อมูลหรือเคสที่จะออกเลข');
    const year = currentYearBE();
    const myKey = group || `${list[0].trr_id}:${slot}`;
    const prev = sarabanRecord(list[0], slot);
    const history = (prev && prev.no ? [{ no: prev.no, issuedAt: prev.issuedAt || '', manual: !!prev.manual }] : []).concat((prev && prev.history) || []);
    let seq = 0;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      /* รวมเลขเดิมของเอกสารนี้ด้วย — ออกใหม่แล้วเลขต้องเดินต่อ ไม่วนกลับมาเลขเดิม */
      const used = usedSeqs(await loadRows(client), prefix, year).map(x => x.seq);
      seq = Math.max(seq, (used.length ? Math.max(...used) : 0)) + 1;
      const record = Object.assign({ no: formatSarabanNo(prefix, seq, year), prefix, seq, year, issuedAt: new Date().toISOString(), manual: false },
        actor(), group ? { group } : {}, history.length ? { history } : {});
      for (const k of list) await writeRecord(client, k, slot, record);
      /* อ่านซ้ำ: เอกสารอื่นที่ได้ลำดับเดียวกันและออกก่อน = ฝั่งนี้ขยับ */
      const clash = usedSeqs(await loadRows(client), prefix, year)
        .some(x => x.key !== myKey && x.seq === seq && (!x.issuedAt || x.issuedAt < record.issuedAt || (x.issuedAt === record.issuedAt && x.key < myKey)));
      if (!clash) return record;
    }
    throw new Error('ออกเลขไม่สำเร็จ มีผู้ขอเลขพร้อมกันหลายรายการ กรุณาลองใหม่');
  }

  /* บันทึกเลขที่พิมพ์เอง (สารบรรณให้มาแล้ว) — ว่าง = ลบ record */
  async function saveManualSarabanNo({ sb, kases, slot, prefix, group, no }) {
    const client = sb || E().getSupabaseClient();
    const value = String(no || '').trim();
    const p = parseSarabanSeq(prefix, null, value);
    const prev = sarabanRecord(kases[0], slot);
    const history = prev && prev.no && prev.no !== value ? [{ no: prev.no, issuedAt: prev.issuedAt || '', manual: !!prev.manual }].concat(prev.history || []) : ((prev && prev.history) || []);
    const record = value ? Object.assign({ no: value, prefix, seq: p ? p.seq : null, year: p ? p.year : null, issuedAt: new Date().toISOString(), manual: true },
      actor(), group ? { group } : {}, history.length ? { history } : {}) : null;
    for (const k of kases.filter(Boolean)) await writeRecord(client, k, slot, record);
    return record;
  }

  /* ---------- ช่องเลขสารบรรณ (ใช้ซ้ำทุกหน้า) ----------
     ECMIS.mountSarabanField({
       input | host,            input เดิมในหน้า (เติมปุ่มต่อท้าย) หรือ host ว่างที่ให้สร้างช่องใหม่
       id, label,               สำหรับช่องใหม่ (host)
       kase | kases, group,     เคสที่เก็บเลข (หลายเคส = เลขเดียวกันทุกเคส)
       slot, prefix, sb, readonly,
       ignoreCaseLock,          true = ไม่ใช้ตัวล็อกตามขั้นของเคส (เอกสารระดับครั้งประชุม)
       onChange(no)             เรียกหลังเลขเปลี่ยน — ใช้ render เอกสาร/preview ใหม่
     }) → { input, value(), refresh() } */
  /* ช่องเลขต้องกว้างพออ่านเลขเต็ม (~11rem) — คอลัมน์แคบ ปุ่มตกลงบรรทัดใหม่เอง ไม่บีบช่องจนเลขถูกตัด */
  const STYLE = `
    .saraban-group { flex-wrap: wrap; gap: .4rem; }
    .saraban-group > .form-control { flex: 1 1 11rem; min-width: 0; border-radius: .375rem !important; }
    .saraban-group > .saraban-btn { flex: 0 0 auto; margin-left: 0 !important; border-radius: .375rem !important; white-space: nowrap; }
    .saraban-meta:not(.is-empty) { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .saraban-meta.is-empty { color: #8a5a00; }
    body.dark-mode .saraban-meta.is-empty, body.high-contrast .saraban-meta.is-empty { color: #e0bd4f; }
    @media (max-width: 480px) { .saraban-group > .saraban-btn { flex: 1 1 100%; } }`;
  function ensureStyle() {
    if (document.getElementById('sarabanStyle')) return;
    const el = document.createElement('style');
    el.id = 'sarabanStyle';
    el.textContent = STYLE;
    document.head.appendChild(el);
  }

  function mountSarabanField(opts) {
    if (!SARABAN_UI_ENABLED) {
      /* ปิดอยู่: ช่องเดิมของหน้าไม่แตะ (ไม่มีปุ่ม/บรรทัดผู้ออกเลข) ส่วนช่องใหม่ซ่อนไว้ — คืน API เดิมให้หน้าที่เรียก refresh()/value() */
      const input = opts.input || null;
      if (!input && opts.host) opts.host.hidden = true;
      return { input, value: () => (input ? input.value.trim() : ''), refresh() {} };
    }
    const ECMIS = E();
    ensureStyle();
    const esc = ECMIS.escapeHtml;
    const kases = (opts.kases || [opts.kase]).filter(Boolean);
    const { slot, prefix, group } = opts;
    let input = opts.input || null;
    let wrap;
    if (input) {
      wrap = document.createElement('div');
      wrap.className = 'input-group saraban-group';
      input.parentNode.insertBefore(wrap, input);
      wrap.appendChild(input);
    } else {
      opts.host.innerHTML = `<label class="form-label" for="${esc(opts.id)}">${esc(opts.label)}</label>
        <div class="input-group saraban-group"><input class="form-control" id="${esc(opts.id)}" autocomplete="off"></div>`;
      input = opts.host.querySelector('input');
      wrap = input.parentNode;
    }
    if (!input.placeholder) input.placeholder = 'เช่น ' + formatSarabanNo(prefix, prefix ? 12 : 210, currentYearBE());
    const metaId = (input.id || slot) + 'SarabanMeta';
    input.setAttribute('aria-describedby', metaId);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-outline-navy saraban-btn';
    btn.innerHTML = '<i class="fa-solid fa-hashtag me-1" aria-hidden="true"></i>ขอเลขสารบรรณ';
    wrap.appendChild(btn);
    const meta = document.createElement('div');
    meta.className = 'form-text saraban-meta';
    meta.id = metaId;
    meta.setAttribute('aria-live', 'polite');
    wrap.insertAdjacentElement('afterend', meta);

    const rec = () => sarabanRecord(kases[0], slot);
    function renderMeta() {
      const r = rec();
      const val = input.value.trim();
      if (!val) {
        meta.className = 'form-text saraban-meta is-empty';
        meta.innerHTML = '<i class="fa-solid fa-triangle-exclamation me-1" aria-hidden="true"></i>ยังไม่มีเลขสารบรรณ — กด "ขอเลขสารบรรณ" หรือพิมพ์เลขที่ได้รับจากงานสารบรรณ';
        return;
      }
      meta.className = 'form-text saraban-meta';
      /* บรรทัดเดียว: วันที่แบบย่อ + ผู้ออก (ข้อความเต็มอยู่ใน title) */
      if (r && r.no === val) {
        const when = r.issuedAt ? shortThaiDate(ECMIS.toBuddhistFakeIso(String(r.issuedAt).slice(0, 10))) : '';
        const kind = r.manual ? 'พิมพ์เอง' : 'ออกเลข';
        meta.innerHTML = `<i class="fa-solid ${r.manual ? 'fa-pen' : 'fa-hashtag'} me-1" aria-hidden="true"></i><span class="visually-hidden">${kind} </span>`
          + esc([when, r.issuedByName].filter(Boolean).join(' · '));
        meta.title = `${r.manual ? 'พิมพ์เอง' : 'ออกเลข'}${when ? ' เมื่อ ' + ECMIS.thaiDate(ECMIS.toBuddhistFakeIso(String(r.issuedAt).slice(0, 10))) : ''}${r.issuedByName ? ' โดย ' + r.issuedByName : ''}`;
      } else { meta.textContent = ''; meta.title = ''; }
    }
    function setValue(v) {
      input.value = v || '';
      renderMeta();
      if (typeof opts.onChange === 'function') opts.onChange(input.value.trim());
    }

    const saved = rec();
    if (saved && saved.no && !input.value.trim()) input.value = saved.no;
    /* ค่าตั้งต้นที่เป็นแค่ prefix (เช่น "ปป ๐๐๐๔/") ไม่นับเป็นเลข */
    if (parseSarabanSeq(prefix, null, input.value) === null && toArabic(input.value).trim() === prefix.trim()) input.value = '';
    renderMeta();

    /* ผู้ที่ไม่ใช่ผู้ดำเนินการขั้นนี้ (ตัวล็อกอ่านอย่างเดียว) ขอเลขไม่ได้ */
    const roleId = ECMIS.currentRoleId ? ECMIS.currentRoleId() : '';
    const readonly = !!opts.readonly || input.disabled || (!opts.ignoreCaseLock && !!(ECMIS.isCaseReadOnlyFor && ECMIS.isCaseReadOnlyFor(kases[0], roleId)));
    btn.classList.toggle('d-none', readonly);

    btn.addEventListener('click', async () => {
      if (input.disabled || input.readOnly) return;
      const current = input.value.trim();
      if (current) {
        const r = await ECMIS.confirmAction({
          title: 'ออกเลขสารบรรณใหม่?',
          html: `<p>ช่องนี้มีเลข <strong>${esc(current)}</strong> อยู่แล้ว</p><p class="mb-0">ถ้าออกเลขใหม่ เลขเดิมจะไม่ถูกใช้ต่อและเลขในทะเบียนจะข้ามไป 1 เลข</p>`,
          confirmText: 'ออกเลขใหม่', icon: 'warning'
        });
        if (!r || !r.isConfirmed) return;
      }
      btn.disabled = true;
      const label = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-1" aria-hidden="true"></i>กำลังออกเลข';
      try {
        const r = await issueSarabanNo({ sb: opts.sb, kases, slot, prefix, group });
        setValue(r.no);
        ECMIS.toastOk('ออกเลขสารบรรณแล้ว · ' + r.no);
      } catch (e) {
        console.error('ออกเลขสารบรรณไม่สำเร็จ:', e);
        ECMIS.toastWarn('ออกเลขสารบรรณไม่สำเร็จ: ' + (e.message || e));
      } finally {
        btn.disabled = false;
        btn.innerHTML = label;
      }
    });

    input.addEventListener('input', renderMeta);
    input.addEventListener('change', async () => {
      const v = input.value.trim();
      const r = rec();
      if ((r ? r.no : '') === v) return;
      try { await saveManualSarabanNo({ sb: opts.sb, kases, slot, prefix, group, no: v }); }
      catch (e) { console.error('บันทึกเลขสารบรรณไม่สำเร็จ:', e); ECMIS.toastWarn('บันทึกเลขสารบรรณไม่สำเร็จ กรุณาลองใหม่'); }
      setValue(v);
    });

    return {
      input,
      value: () => input.value.trim(),
      refresh() { const r = rec(); if (r && r.no && !input.value.trim()) input.value = r.no; renderMeta(); }
    };
  }

  const api = { SARABAN_UI_ENABLED, nextSarabanNo, issueSarabanNo, saveManualSarabanNo, mountSarabanField, formatSarabanNo, parseSarabanSeq, sarabanNoOf, sarabanRecord, sarabanThai };
  if (root.ECMIS) Object.assign(root.ECMIS, api);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
