/* Task 324: แยกมติรายผู้ถูกกล่าวหา สำหรับหน้าบันทึกมติ 7.1 (board-resolution.html) และ 7.3 เรื่องของ กกม.
   (board-resolution.html / resolution.html) — แนวเดียวกับ 7.2 (resolution-72.html, Task 323)
   · 7.1 รายคน: รับไว้ไต่สวน / ไม่รับเรื่องไว้พิจารณา / ข้อกล่าวหาไม่มีมูล — รูปแบบการไต่สวน (ม.24 ว.1/ว.3) เป็นของทั้งเรื่อง
     มติสรุป: มีรับ ≥1 คน = รับไว้ไต่สวน, ไม่งั้นมีไม่มีมูล ≥1 คน = ไม่มีมูล, ไม่งั้น ไม่รับเรื่อง
   · 7.3 กกม. รายคน: ไม่อุทธรณ์ / ไม่ฎีกา / ไม่เห็นพ้องอัยการ / อื่น ๆ
     มติสรุป: มีไม่เห็นพ้อง ≥1 คน = ไม่เห็นพ้อง, ไม่งั้น ไม่ฎีกา > ไม่อุทธรณ์ > อื่น ๆ
   เก็บผลรายคนใน accusedSplit7x / accusedDecisions7x ของข้อมูลมติ (trr_resolution_data) */
(function (root) {
  'use strict';

  const ACT_LAW = 'พระราชบัญญัติมาตรการของฝ่ายบริหารในการป้องกันและปราบปรามการทุจริต พ.ศ. ๒๕๕๑ และที่แก้ไขเพิ่มเติม';

  const KINDS = {
    '71': {
      saveKey: 'accusedDecisions71',
      flagKey: 'accusedSplit71',
      splitCodes: ['ACCEPT_S24P1', 'ACCEPT_S24P3', 'NOT_ACCEPTED', 'NO_GROUND'],
      statuses: { ACCEPT: 'รับไว้ไต่สวน', NOT_ACCEPTED: 'ไม่รับเรื่องไว้พิจารณา', NO_GROUND: 'ข้อกล่าวหาไม่มีมูล' },
      statusOf: code => (String(code).startsWith('ACCEPT') ? 'ACCEPT' : code),
      note: 'แยกมติรายคนได้เฉพาะมติรับไว้ไต่สวน / ไม่รับเรื่องไว้พิจารณา / ข้อกล่าวหาไม่มีมูล — มีผู้ที่รับไว้ไต่สวนอย่างน้อย 1 คน เรื่องจะไปขั้นออกคำสั่งแต่งตั้ง ม.24 (เฉพาะคนที่รับ)'
    },
    '73': {
      saveKey: 'accusedDecisions73',
      flagKey: 'accusedSplit73',
      splitCodes: ['KKM_NO_APPEAL', 'KKM_NO_DIKA', 'KKM_DISAGREE_AG', 'KKM_OTHER'],
      statuses: { KKM_NO_APPEAL: 'เห็นชอบไม่อุทธรณ์', KKM_NO_DIKA: 'เห็นชอบไม่ฎีกา', KKM_DISAGREE_AG: 'ไม่เห็นพ้องกับพนักงานอัยการ', KKM_OTHER: 'อื่น ๆ' },
      statusOf: code => code,
      note: 'มติรายจำเลย/ผู้ถูกกล่าวหา — มีผู้ที่ไม่เห็นพ้องกับพนักงานอัยการอย่างน้อย 1 คน มติสรุปของเรื่องเป็นไม่เห็นพ้อง (ส่งอัยการสูงสุด ม.43)'
    }
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function acceptText(variant) {
    return variant === 'ACCEPT_S24P3'
      ? `รับไว้ไต่สวน โดยให้ดำเนินการไต่สวนเป็นคณะอนุกรรมการไต่สวน ตามมาตรา ๒๔ วรรคสาม แห่ง${ACT_LAW}`
      : `รับไว้ไต่สวน โดยให้ดำเนินการไต่สวนเป็นองค์คณะ ตามมาตรา ๒๔ วรรคหนึ่ง แห่ง${ACT_LAW}`;
  }

  /* ข้อความมติรายคน (HTML — ค่าที่ผู้ใช้พิมพ์ผ่าน M ซึ่ง escape แล้ว) */
  function personText(kind, p, ctx) {
    const M = ctx.M;
    if (kind === '71') {
      if (p.status === 'ACCEPT') return acceptText(ctx.acceptVariant);
      if (p.status === 'NO_GROUND') {
        return `ข้อกล่าวหาไม่มีมูล ให้ข้อกล่าวหานั้นเป็นอันตกไป ตามมาตรา ๓๒ แห่ง${ACT_LAW} และให้แจ้งผู้ถูกกล่าวหาทราบไม่ช้ากว่าสิบห้าวันนับแต่วันที่คณะกรรมการ ป.ป.ท. มีมติ`;
      }
      return `ไม่รับไว้ไต่สวน เนื่องจาก ${M(p.reason, '……………………')} ตาม${ACT_LAW} มาตรา ${M(p.law, '…………')}`;
    }
    if (p.status === 'KKM_NO_APPEAL') {
      return 'เห็นชอบไม่อุทธรณ์คำพิพากษาของศาลอาญาคดีทุจริตและประพฤติมิชอบภาค 2 ตามความเห็นของพนักงานอัยการ เนื่องจากศาลได้มีคำพิพากษาลงโทษจำเลย เป็นไปตามฟ้องของพนักงานอัยการและสอดคล้องกับมติของคณะกรรมการ ป.ป.ท. ที่วินิจฉัยชี้มูลความผิดโดยชอบด้วยข้อเท็จจริงและข้อกฎหมายแล้ว';
    }
    if (p.status === 'KKM_NO_DIKA') return `เห็นชอบไม่ฎีกาคำพิพากษาของศาลอุทธรณ์ ตามความเห็นของพนักงานอัยการ เนื่องจาก ${M(p.reason, '……………………')}`;
    if (p.status === 'KKM_DISAGREE_AG') {
      return `ไม่เห็นพ้องด้วยกับความเห็นของพนักงานอัยการ ${M(p.reason, '……………………')} และส่งเรื่องให้อัยการสูงสุด พิจารณาตามมาตรา 43 แห่ง${ACT_LAW} ต่อไป`;
    }
    return M(p.reason, '……………………………………');
  }

  function create(opts) {
    const kind = opts.kind;
    const cfg = KINDS[kind];
    const host = opts.host;               // กล่องสวิตช์ + การ์ด (ฝั่งฟอร์ม)
    const tabPane = opts.tabPane;         // แถวแท็บฉบับเอกสาร (แถบเครื่องมือเอกสาร)
    const tabBox = opts.tabBox;
    const kase = opts.kase;
    const accusedOf = () => (Array.isArray(kase.accused) ? kase.accused : []);
    const uid = 'rs' + kind;
    let splitMode = false;
    let activeIdx = null;
    let acceptVariant = 'ACCEPT_S24P1';
    let perAccused = [];
    let readOnly = false;

    function baseCode() { return opts.getCode(); }
    function canSplit() { return accusedOf().length > 1 && cfg.splitCodes.includes(baseCode()); }
    function isSplit() { return splitMode && canSplit(); }

    function seed() {
      const cur = baseCode();
      const st = cfg.splitCodes.includes(cur) ? cfg.statusOf(cur) : Object.keys(cfg.statuses)[0];
      if (kind === '71' && String(cur).startsWith('ACCEPT')) acceptVariant = cur;
      const d = (opts.defaults && opts.defaults()) || {};
      perAccused = accusedOf().map(acc => ({ name: acc.name || '', status: st, law: d.law || '', reason: d.reason || '' }));
    }

    function effectiveCode() {
      if (!isSplit()) return baseCode();
      const has = s => perAccused.some(p => p.status === s);
      if (kind === '71') return has('ACCEPT') ? acceptVariant : (has('NO_GROUND') ? 'NO_GROUND' : 'NOT_ACCEPTED');
      return ['KKM_DISAGREE_AG', 'KKM_NO_DIKA', 'KKM_NO_APPEAL', 'KKM_OTHER'].find(has) || baseCode();
    }

    function lawOptions() {
      const src = opts.lawSelect;
      return src ? Array.from(src.options).map(o => `<option value="${esc(o.value)}">${esc(o.textContent)}</option>`).join('') : '';
    }

    function renderHost() {
      const show = canSplit();
      host.classList.toggle('d-none', !show);
      if (!show) return;
      const on = isSplit();
      const label = kind === '73' ? 'แยกมติรายจำเลย/ผู้ถูกกล่าวหา' : 'แยกมติรายผู้ถูกกล่าวหา';
      const variantHtml = kind === '71' && on && perAccused.some(p => p.status === 'ACCEPT') ? `
        <div class="mt-2">
          <label class="form-label small mb-1" for="${uid}_variant">รูปแบบการไต่สวน (สำหรับผู้ที่รับไว้ไต่สวน — ใช้ทั้งเรื่อง)</label>
          <select class="form-select form-select-sm" id="${uid}_variant" data-rs="variant" ${readOnly ? 'disabled' : ''}>
            <option value="ACCEPT_S24P1" ${acceptVariant === 'ACCEPT_S24P1' ? 'selected' : ''}>ไต่สวนเป็นองค์คณะ (ม.24 วรรคหนึ่ง)</option>
            <option value="ACCEPT_S24P3" ${acceptVariant === 'ACCEPT_S24P3' ? 'selected' : ''}>ไต่สวนเป็นคณะอนุกรรมการไต่สวน (ม.24 วรรคสาม)</option>
          </select>
        </div>` : '';
      const cards = !on ? '' : perAccused.map((p, idx) => {
        const acc = accusedOf()[idx] || {};
        const id = k => `${uid}_${idx}_${k}`;
        const needReason = kind === '71' ? p.status === 'NOT_ACCEPTED' : p.status !== 'KKM_NO_APPEAL';
        const reasonLabel = kind === '71' ? 'เหตุผลที่ไม่รับ (ต่อท้าย "เนื่องจาก")'
          : (p.status === 'KKM_OTHER' ? 'ข้อความมติ' : 'เหตุผล/ความเห็น');
        return `
        <div class="p-2 mb-2 border rounded" data-rs-idx="${idx}">
          <div class="d-flex flex-wrap align-items-center gap-1 mb-2">
            <span class="badge bg-secondary">ลำดับ ${idx + 1}</span>
            <strong style="color:var(--ecmis-navy)" id="${id('name')}">${esc(p.name)}</strong>
            <span class="text-muted small">${esc(acc.pos || '')} ${acc.agency ? '(' + esc(acc.agency) + ')' : ''}</span>
          </div>
          <div class="d-flex flex-wrap gap-3" role="radiogroup" aria-labelledby="${id('name')}">
            ${Object.keys(cfg.statuses).map(code => `
            <div class="form-check m-0">
              <input class="form-check-input" type="radio" name="${id('st')}" id="${id('st_' + code)}" value="${code}" data-rs="status" ${p.status === code ? 'checked' : ''} ${readOnly ? 'disabled' : ''}>
              <label class="form-check-label" for="${id('st_' + code)}">${cfg.statuses[code]}</label>
            </div>`).join('')}
          </div>
          ${kind === '71' && p.status === 'NOT_ACCEPTED' ? `
          <div class="mt-2">
            <label class="form-label small mb-1" for="${id('law')}">มาตราที่ใช้อ้างอิง (ม.25 / ม.26)</label>
            <select class="form-select form-select-sm" id="${id('law')}" data-rs="law" ${readOnly ? 'disabled' : ''}>${lawOptions()}</select>
          </div>` : ''}
          ${needReason ? `
          <div class="mt-2">
            <label class="form-label small mb-1" for="${id('reason')}">${reasonLabel}</label>
            <textarea class="form-control" id="${id('reason')}" rows="2" data-rs="reason" ${readOnly ? 'disabled' : ''}>${esc(p.reason)}</textarea>
          </div>` : ''}
        </div>`;
      }).join('');
      host.innerHTML = `
        <label class="form-label fw-bold text-navy" id="${uid}_label"><i class="fa-solid fa-users me-1"></i>รูปแบบมติ</label>
        <div class="d-flex flex-wrap gap-3" role="radiogroup" aria-labelledby="${uid}_label">
          <div class="form-check m-0">
            <input class="form-check-input" type="radio" name="${uid}_mode" id="${uid}_same" value="SAME" data-rs="mode" ${on ? '' : 'checked'} ${readOnly ? 'disabled' : ''}>
            <label class="form-check-label" for="${uid}_same">มติเดียวกันทุกคน</label>
          </div>
          <div class="form-check m-0">
            <input class="form-check-input" type="radio" name="${uid}_mode" id="${uid}_split" value="SPLIT" data-rs="mode" ${on ? 'checked' : ''} ${readOnly ? 'disabled' : ''}>
            <label class="form-check-label" for="${uid}_split">${label}</label>
          </div>
        </div>
        <small class="text-muted d-block mt-1">${cfg.note}</small>
        ${variantHtml}
        <div class="mt-2">${cards}</div>`;
      perAccused.forEach((p, idx) => { const s = document.getElementById(`${uid}_${idx}_law`); if (s) s.value = p.law; });
    }

    function renderTabs() {
      const on = isSplit();
      if (tabPane) { tabPane.classList.toggle('d-none', !on); tabPane.classList.toggle('d-flex', on); }
      if (!tabBox) return;
      if (!on) { activeIdx = null; tabBox.innerHTML = ''; return; }
      if (activeIdx !== null && !perAccused[activeIdx]) activeIdx = null;
      const tabs = [{ id: null, label: 'ฉบับรวม (ทุกคน)' },
        ...perAccused.map((p, idx) => ({ id: idx, label: `ฉบับที่ ${idx + 1}: ${(p.name || '').split(' ')[0] || p.name}` }))];
      tabBox.innerHTML = tabs.map(t => `
        <button type="button" class="btn btn-xs ${activeIdx === t.id ? 'btn-navy' : 'btn-outline-secondary'} py-0 px-2" data-rs-tab="${t.id === null ? 'all' : t.id}" aria-pressed="${activeIdx === t.id}">${esc(t.label)}</button>`).join('');
    }

    function apply() {
      if (splitMode && canSplit() && (perAccused.length !== accusedOf().length || perAccused.some(p => !cfg.statuses[p.status]))) seed();
      renderHost();
      renderTabs();
      if (opts.onLayout) opts.onLayout(isSplit());
    }

    host.addEventListener('change', e => {
      const t = e.target;
      if (t.dataset.rs === 'mode') {
        splitMode = t.value === 'SPLIT';
        if (splitMode) seed();
        apply(); opts.onChange();
        return;
      }
      if (t.dataset.rs === 'variant') { acceptVariant = t.value; opts.onChange(); return; }
      const card = t.closest('[data-rs-idx]');
      if (!card) return;
      const p = perAccused[Number(card.dataset.rsIdx)];
      if (t.dataset.rs === 'status') { p.status = t.value; apply(); opts.onChange(); return; }
      if (t.dataset.rs === 'law') { p.law = t.value; opts.onChange(); }
    });
    host.addEventListener('input', e => {
      const t = e.target;
      const card = t.closest('[data-rs-idx]');
      if (!card || t.dataset.rs !== 'reason') return;
      perAccused[Number(card.dataset.rsIdx)].reason = t.value.trim();
      opts.onChange();
    });
    if (tabBox) tabBox.addEventListener('click', e => {
      const b = e.target.closest('[data-rs-tab]');
      if (!b) return;
      activeIdx = b.dataset.rsTab === 'all' ? null : Number(b.dataset.rsTab);
      renderTabs(); opts.onChange();
    });

    return {
      kind,
      isSplit,
      effectiveCode,
      apply,
      activeOne: () => (isSplit() && activeIdx !== null ? { p: perAccused[activeIdx], idx: activeIdx, acc: accusedOf()[activeIdx] } : null),
      docAccused: () => (isSplit() && activeIdx !== null ? [accusedOf()[activeIdx]] : accusedOf()),
      people: () => perAccused.slice(),
      labelOf: s => cfg.statuses[s] || s,
      /* ส่วน "มติที่ประชุม" ข้อ ๑ ของเอกสารโหมดแยก */
      resolutionHtml(voteText, M) {
        const ctx = { M, acceptVariant };
        const one = activeIdx !== null ? perAccused[activeIdx] : null;
        if (one) {
          return `<div>๑. คณะกรรมการ ป.ป.ท. มีมติ${voteText}ในส่วนของ${M(one.name)}</div>
          <div style="padding-left:1.5em">- ${personText(kind, one, ctx)}</div>`;
        }
        return `<div>๑. คณะกรรมการ ป.ป.ท. มีมติ${voteText}${kind === '73' ? 'รายจำเลย/ผู้ถูกกล่าวหา' : 'รายผู้ถูกกล่าวหา'} ดังนี้</div>
          ${perAccused.map((p, i) => `<div style="padding-left:1.5em">(${M(String(i + 1))}) ${M(p.name)} — ${personText(kind, p, ctx)}</div>`).join('')}`;
      },
      /* ตรวจก่อนบันทึก — คืนข้อความเตือน หรือ '' ถ้าผ่าน */
      validate() {
        if (!isSplit()) return '';
        for (const p of perAccused) {
          if (kind === '71' && p.status === 'NOT_ACCEPTED' && !p.law) return `${p.name}: กรุณาเลือกมาตราอ้างอิงตาม ม.25 / ม.26`;
          if (kind === '73' && p.status !== 'KKM_NO_APPEAL' && !p.reason) return `${p.name}: กรุณาระบุ${p.status === 'KKM_OTHER' ? 'ข้อความมติ' : 'เหตุผล/ความเห็น'}`;
        }
        return '';
      },
      summaryHtml() {
        return `<ul class="mb-2 ps-3">${perAccused.map(p => `<li>${esc(p.name)} — ${esc(cfg.statuses[p.status] || p.status)}</li>`).join('')}</ul>`;
      },
      /* ฟิลด์ที่เขียนรวมลงข้อมูลมติ */
      serialize() {
        const out = { [cfg.flagKey]: isSplit() };
        if (!isSplit()) return out;
        const M = v => esc(v);
        out[cfg.saveKey] = perAccused.map((p, i) => {
          const acc = accusedOf()[i] || {};
          const tmp = document.createElement('div');
          tmp.innerHTML = personText(kind, p, { M: (v, ph) => M(v && String(v).trim() ? v : (ph || '')), acceptVariant });
          return {
            no: acc.no, name: p.name, pos: acc.pos || '', agency: acc.agency || '',
            status: p.status,
            code: kind === '71' && p.status === 'ACCEPT' ? acceptVariant : p.status,
            law: kind === '71' && p.status === 'NOT_ACCEPTED' ? p.law : '',
            reason: p.reason || '',
            text: tmp.textContent || ''
          };
        });
        return out;
      },
      /* โหลดมติรายคนที่บันทึกไว้ (หน้าหลังมติ/เปิดซ้ำ) */
      restore(src, lock) {
        readOnly = !!lock;
        const rows = src && Array.isArray(src[cfg.saveKey]) ? src[cfg.saveKey] : null;
        if (!src || !src[cfg.flagKey] || !rows || !rows.length) { apply(); return; }
        splitMode = true;
        perAccused = accusedOf().map(acc => {
          const r = rows.find(x => x.name === acc.name) || {};
          return { name: acc.name || '', status: cfg.statuses[r.status] ? r.status : Object.keys(cfg.statuses)[0], law: r.law || '', reason: r.reason || '' };
        });
        const acc = rows.find(r => r.status === 'ACCEPT' && r.code);
        if (acc) acceptVariant = acc.code;
        apply();
      }
    };
  }

  /* 7.1: คำสั่งแต่งตั้ง ม.24 ใช้เฉพาะผู้ถูกกล่าวหาที่มีมติรับไว้ไต่สวน (กรณีแยกมติรายคน) */
  function acceptedAccused71(source, list) {
    if (!source || !source.accusedSplit71 || !Array.isArray(source.accusedDecisions71)) return list;
    const ok = new Set(source.accusedDecisions71.filter(r => r.status === 'ACCEPT').map(r => r.name));
    const out = (list || []).filter(a => ok.has(a.name));
    return out.length ? out : list;
  }

  const api = { create, acceptedAccused71, KINDS };
  root.ECMISResolutionSplit = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
