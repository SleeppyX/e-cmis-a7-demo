/* ปิดสำนวนสาย 7.1 หลังบอร์ดมีมติที่ "ไม่ใช่รับไว้ไต่สวน" (B2 / Task 175)

   เดิม transition CLOSE_CASE / DISPATCH_EXTERNAL / UPLOAD_SIGNED_SCAN / REVISE_RESOLUTION มีใน
   TRANSITIONS แต่ไม่มีหน้าไหนเรียกใช้ สำนวนที่มติเป็นไม่รับไว้ ไม่มีมูล จำหน่าย ส่งเรื่อง ฯลฯ
   จึงค้างที่ RESOLVED ตลอด (มติรับไว้ไต่สวนมีทางไปต่อที่ order.html อยู่แล้ว)

   แผงนี้ใช้ใน order.html — กลุ่มงานกิจการคณะกรรมการ (affairs) เป็นผู้ปิดทุกมติ ส่วนมติส่งเรื่องให้
   หน่วยงานนอกองค์กร (เช่น ป.ป.ช.) ต้องบันทึกส่งออก → รอฉบับลงนามกลับ → แนบก่อนจึงปิดได้
   (ตามกฎใน FORWARD_TARGETS: requireSignedScan / requireArchiveCopy)
   สาย 7.2 และ 7.3 ไม่อยู่ในแผงนี้ (7.2 ปิดที่ ruling-report.html, 7.3 อยู่ใน B10) */
(function (g) {
  const E = () => g.ECMIS;
  const CLOSER_ROLE = 'affairs';
  const REAGENDA_CODES = ['MORE_INVESTIGATE', 'OTHER'];

  function resCode(k) {
    return k.code || (k.resolutionData && k.resolutionData.code) || (typeof k.resolution === 'string' ? k.resolution : '');
  }
  function applies(k) {
    const c = resCode(k);
    return !!(k && c && !c.startsWith('ACCEPT') &&
      ['RESOLVED', 'DISPATCHING', 'CLOSED'].includes(k.status) &&
      !E().isCase72(k) && !E().isCase73(k));
  }

  function applies73(k) {
    return !!(k && E().isCase73(k) && ['RESOLVED', 'DISPATCHING', 'CLOSED'].includes(k.status) && resCode(k));
  }

  function mount(opts) {
    const { kase, role, sb, host } = opts;
    const ECMIS = E();
    const esc = ECMIS.escapeHtml;
    if (host && applies73(kase)) return mount73(opts);
    if (!host || !applies(kase)) { if (host) host.classList.add('d-none'); return false; }
    const code = resCode(kase);
    const res = (ECMIS.RESOLUTIONS || []).find(x => x.code === code);
    const rd = kase.resolutionData || {};
    const mayClose = role.id === CLOSER_ROLE;
    const targets = ECMIS.FORWARD_TARGETS || [];
    const target = () => (ECMIS.forwardTarget && ECMIS.forwardTarget(rd.forwardTo || kase.forwardTo)) || null;

    const head = `<div class="card-header"><i class="fa-solid fa-folder-closed"></i> ดำเนินการหลังมติ — ไม่ต้องออกคำสั่งแต่งตั้ง ม.24</div>`;
    const resLine = `<p class="mb-2">มติของเรื่องนี้: <strong>${esc(res ? res.label : code)}</strong>
      ${kase.meetingNo ? `<span class="text-muted small ms-2">ครั้งที่ ${esc(kase.meetingNo)}${kase.agendaNo ? ' วาระที่ ' + esc(kase.agendaNo) : ''}</span>` : ''}</p>`;

    function view(html) {
      host.classList.remove('d-none');
      host.innerHTML = `<div class="ws-card mb-3" id="closureCard">${head}<div class="card-body">${resLine}${html}</div></div>`;
    }

    function noRight() {
      return `<div class="no-permission"><i class="fa-solid fa-lock me-1"></i>ผู้ปิดสำนวนคือกลุ่มงานกิจการคณะกรรมการ — บทบาทของคุณดูได้อย่างเดียว</div>`;
    }

    async function persist(toStatus, dataPatch, eventType, note) {
      const from = kase.status;
      const code3 = ECMIS.STATUS_CODE[toStatus];
      if (!code3) throw new Error('ไม่พบรหัสสถานะ ' + toStatus);
      const merged = Object.assign({}, kase.resolutionData || {}, dataPatch || {});
      if (sb && kase.trr_id) {
        const { error } = await sb.from('tbl_res_request')
          .update({ trr_status: code3, trr_resolution_data: merged }).eq('trr_id', kase.trr_id);
        if (error) throw error;
        await ECMIS.logRequestEvent(kase.trr_id, from, toStatus, {
          type: eventType, actorRole: role.id, note: note || null, data: dataPatch || null
        });
      }
      kase.status = toStatus;
      kase.resolutionData = merged;
      Object.assign(kase, dataPatch || {});
      const mem = (ECMIS.CASES || []).find(x => x.id === kase.id);
      if (mem) mem.status = toStatus;
    }
    function reload() { setTimeout(() => location.reload(), 900); }
    async function confirm(title, html, confirmText) {
      const r = await ECMIS.confirmAction({ title, html, confirmText });
      return !!(r && r.isConfirmed);
    }

    /* ---------- ปิดสำนวนแล้ว ---------- */
    if (kase.status === 'CLOSED') {
      const c = rd.closure || {};
      const fw = target();
      view(`<div class="alert alert-success py-2 mb-0"><i class="fa-solid fa-circle-check me-1"></i>ปิดสำนวนแล้ว
        ${c.closedAt ? ` เมื่อ ${esc(ECMIS.thaiDate ? ECMIS.thaiDate(String(c.closedAt).slice(0, 10)) : c.closedAt)}` : ''}
        ${fw || rd.forwardToOther ? `<div class="small mt-1">ส่งเรื่องให้: ${esc(fw ? fw.label : rd.forwardToOther)}</div>` : ''}
        ${rd.signedScanName ? `<div class="small">ฉบับลงนามที่แนบ: ${esc(rd.signedScanName)}</div>` : ''}
        ${c.note ? `<div class="small mt-1">หมายเหตุ: ${esc(c.note)}</div>` : ''}</div>`);
      return true;
    }

    /* ---------- ส่งออกแล้ว รอฉบับลงนามกลับ ---------- */
    if (kase.status === 'DISPATCHING') {
      const fw = target();
      if (!mayClose) { view(noRight()); return true; }
      view(`<div class="alert alert-warning py-2"><i class="fa-solid fa-paper-plane me-1"></i>ส่งเรื่องให้ <strong>${esc(fw ? fw.label : (rd.forwardToOther || '-'))}</strong> แล้ว — รอฉบับลงนามกลับ
          ${fw && fw.statutoryBasis ? `<div class="small text-muted mt-1">${esc(fw.statutoryBasis)}</div>` : ''}</div>
        <div class="row g-2">
          <div class="col-md-6"><label class="form-label field-req">ชื่อไฟล์สแกนฉบับลงนามที่ได้รับกลับ</label>
            <input class="form-control" id="clScan" placeholder="เช่น หนังสือนำส่ง_ลงนาม.pdf"></div>
          <div class="col-md-6"><label class="form-label">หมายเหตุ</label><input class="form-control" id="clNote"></div>
        </div>
        ${fw && fw.requireArchiveCopy ? `<div class="form-check mt-2"><input class="form-check-input" type="checkbox" id="clArchive">
          <label class="form-check-label" for="clArchive">คัดสำเนาสำนวนเก็บรักษาไว้เป็นหลักฐานแล้ว ${fw.archiveBasis ? `<span class="text-muted small">(${esc(fw.archiveBasis)})</span>` : ''}</label></div>` : ''}
        <div class="mt-3"><button type="button" class="btn btn-navy btn-sm" id="clDo"><i class="fa-solid fa-folder-closed me-1"></i>บันทึกรับฉบับลงนามและปิดสำนวน</button></div>`);
      document.getElementById('clDo').addEventListener('click', async () => {
        const scan = document.getElementById('clScan').value.trim();
        const arch = document.getElementById('clArchive');
        if (!scan) { ECMIS.toastWarn('กรุณาระบุชื่อไฟล์สแกนฉบับลงนามก่อนปิดสำนวน'); return; }
        if (arch && !arch.checked) { ECMIS.toastWarn('ต้องคัดสำเนาสำนวนเก็บไว้เป็นหลักฐานก่อนปิดสำนวน'); return; }
        const next = { signedScanUploaded: true, signedScanName: scan, archiveCopyKept: !!(arch && arch.checked) };
        const gate = ECMIS.canTransition('DISPATCHING', 'CLOSED', Object.assign({}, kase, next));
        if (!gate.ok) { ECMIS.toastWarn('ปิดสำนวนยังไม่ได้: ' + (gate.guards || [gate.reason]).join(' / ')); return; }
        if (!await confirm('ยืนยันปิดสำนวน', `<p>สำนวน <strong>${esc(kase.id)}</strong> — รับฉบับลงนามกลับแล้ว</p>`, 'ปิดสำนวน')) return;
        try {
          await persist('CLOSED', Object.assign(next, { closure: { closedAt: new Date().toISOString(), note: document.getElementById('clNote').value.trim(), by: role.id } }), 'UPLOAD_SIGNED_SCAN');
        } catch (e) { console.error(e); ECMIS.toastWarn('บันทึกลงฐานข้อมูลไม่สำเร็จ: ' + e.message); return; }
        ECMIS.toastOk('ปิดสำนวนเรียบร้อย'); reload();
      });
      return true;
    }

    /* ---------- RESOLVED: ยังไม่ได้ดำเนินการหลังมติ ---------- */
    if (!mayClose) { view(noRight()); return true; }
    const isForward = code === 'FORWARD';
    const canReagenda = REAGENDA_CODES.includes(code);
    const forwardBox = isForward ? `
      <div class="row g-2 mb-2">
        <div class="col-md-6"><label class="form-label field-req">ส่งเรื่องให้</label>
          <select class="form-select" id="clFwd">${targets.map(t => `<option value="${t.code}">${esc(t.label)}${t.external ? ' (หน่วยงานนอกองค์กร)' : ''}</option>`).join('')}</select></div>
        <div class="col-md-6 d-none" id="clFwdOtherBox"><label class="form-label field-req">ระบุปลายทาง</label>
          <input class="form-control" id="clFwdOther" placeholder="หน่วยงาน/คณะที่ส่งเรื่องให้"></div>
      </div><div class="form-text mb-2" id="clFwdHint"></div>` : '';
    view(`${forwardBox}
      <div class="mb-2"><label class="form-label">หมายเหตุ / เหตุผลการดำเนินการ${canReagenda ? '' : ' (ถ้ามี)'}</label>
        <textarea class="form-control" id="clNote" rows="2"></textarea></div>
      <div class="d-flex flex-wrap gap-2 mt-2" id="clBtns"></div>`);

    const btns = document.getElementById('clBtns');
    const note = () => document.getElementById('clNote').value.trim();
    const add = (id, cls, icon, label) => {
      btns.insertAdjacentHTML('beforeend', `<button type="button" class="btn ${cls} btn-sm" id="${id}"><i class="fa-solid ${icon} me-1"></i>${label}</button>`);
      return document.getElementById(id);
    };

    if (isForward) {
      const sel = document.getElementById('clFwd');
      const sync = () => {
        const t = targets.find(x => x.code === sel.value) || {};
        document.getElementById('clFwdOtherBox').classList.toggle('d-none', sel.value !== 'OTHER');
        document.getElementById('clFwdHint').textContent = t.external
          ? 'ปลายทางนอกองค์กร: บันทึกส่งออกแล้วต้องรอฉบับลงนามกลับและคัดสำเนาสำนวนเก็บ จึงปิดสำนวนได้' : 'ปลายทางภายในองค์กร: ปิดสำนวนได้ทันทีหลังบันทึกส่งเรื่อง';
        doBtn.innerHTML = t.external
          ? '<i class="fa-solid fa-paper-plane me-1"></i>บันทึกส่งเรื่อง — รอฉบับลงนามกลับ'
          : '<i class="fa-solid fa-folder-closed me-1"></i>บันทึกส่งเรื่องและปิดสำนวน';
      };
      var doBtn = add('clDo', 'btn-navy', 'fa-paper-plane', '');
      sel.addEventListener('change', sync); sync();
      doBtn.addEventListener('click', async () => {
        const t = targets.find(x => x.code === sel.value) || {};
        const other = (document.getElementById('clFwdOther').value || '').trim();
        if (sel.value === 'OTHER' && !other) { ECMIS.toastWarn('กรุณาระบุปลายทางที่ส่งเรื่องให้'); return; }
        const to = t.external ? 'DISPATCHING' : 'CLOSED';
        const gate = ECMIS.canTransition('RESOLVED', to, Object.assign({}, kase, { resolution: 'FORWARD', forwardTo: sel.value }));
        if (!gate.ok) { ECMIS.toastWarn('ดำเนินการยังไม่ได้: ' + (gate.guards || [gate.reason]).join(' / ')); return; }
        if (!await confirm(t.external ? 'ยืนยันบันทึกส่งเรื่อง' : 'ยืนยันปิดสำนวน', `<p>สำนวน <strong>${esc(kase.id)}</strong> ส่งเรื่องให้ <strong>${esc(sel.value === 'OTHER' ? other : t.label)}</strong></p>`, 'ยืนยัน')) return;
        const patch = { forwardTo: sel.value, forwardToOther: sel.value === 'OTHER' ? other : '' };
        if (to === 'CLOSED') patch.closure = { closedAt: new Date().toISOString(), note: note(), by: role.id };
        else patch.dispatchNote = note();
        try { await persist(to, patch, t.external ? 'DISPATCH_EXTERNAL' : 'CLOSE_CASE', note()); }
        catch (e) { console.error(e); ECMIS.toastWarn('บันทึกลงฐานข้อมูลไม่สำเร็จ: ' + e.message); return; }
        ECMIS.toastOk(t.external ? 'บันทึกส่งเรื่องแล้ว — รอฉบับลงนามกลับ' : 'ปิดสำนวนเรียบร้อย'); reload();
      });
    } else {
      add('clClose', 'btn-navy', 'fa-folder-closed', 'ปิดสำนวน').addEventListener('click', async () => {
        if (canReagenda && !note()) { ECMIS.toastWarn('กรุณาระบุหมายเหตุ/เหตุผลก่อนปิดสำนวน'); return; }
        if (!await confirm('ยืนยันปิดสำนวน', `<p>สำนวน <strong>${esc(kase.id)}</strong> — มติ: ${esc(res ? res.label : code)}</p>`, 'ปิดสำนวน')) return;
        try { await persist('CLOSED', { closure: { closedAt: new Date().toISOString(), note: note(), by: role.id } }, 'CLOSE_CASE', note()); }
        catch (e) { console.error(e); ECMIS.toastWarn('บันทึกลงฐานข้อมูลไม่สำเร็จ: ' + e.message); return; }
        ECMIS.toastOk('ปิดสำนวนเรียบร้อย'); reload();
      });
    }
    if (canReagenda) {
      add('clRe', 'btn-outline-navy', 'fa-calendar-plus', 'ขอเข้าวาระใหม่ (ทบทวนมติ)').addEventListener('click', async () => {
        if (!note()) { ECMIS.toastWarn('กรุณาระบุเหตุผลที่ขอเข้าวาระใหม่'); return; }
        if (!await confirm('ยืนยันขอเข้าวาระใหม่', `<p>สำนวน <strong>${esc(kase.id)}</strong> จะกลับไปสถานะ "บรรจุระเบียบวาระ" — มติเดิม (${esc(res ? res.label : code)}) ยังเก็บไว้ในประวัติ</p>`, 'ขอเข้าวาระใหม่')) return;
        try {
          await persist('AGENDA_SET', { reagendaPending: true, reagendaReason: note(), previousResolution: { code, label: res ? res.label : code, meetingNo: kase.meetingNo || '', agendaNo: kase.agendaNo || '', at: rd.resolvedAtIso || '' } }, 'REVISE_RESOLUTION', note());
        } catch (e) { console.error(e); ECMIS.toastWarn('บันทึกลงฐานข้อมูลไม่สำเร็จ: ' + e.message); return; }
        ECMIS.toastOk('ส่งกลับไปบรรจุวาระใหม่แล้ว — ฝ่ายเลขานุการบอร์ดจะบรรจุเข้าครั้งประชุมใหม่');
        reload();
      });
    }
    return true;
  }

  /* ---------- สาย 7.3 (B10 / Task 178) ----------
     ผัง "มติเรื่องทั่วไป": จัดทำมติเป็นลายลักษณ์อักษรแล้ว กลุ่มงานกิจการฯ ส่งเอกสารให้ผู้รับผิดชอบดำเนินการ
     ตามอำนาจหน้าที่ (มติอนุมัติ/เฉพาะกิจ อาจมีคำสั่งแต่งตั้งคณะอนุกรรมการ/คณะทำงาน — บันทึกเลขที่คำสั่งไว้)
     มติส่งกองกฎหมายก่อน → DISPATCHING รอความเห็น → เข้าวาระใหม่ (reagendaPending) หรือปิดเรื่อง */
  function mount73(opts) {
    const { kase, role, sb, host } = opts;
    const ECMIS = E();
    const esc = ECMIS.escapeHtml;
    const code = resCode(kase);
    const res = ECMIS.resolution73 && ECMIS.resolution73(code);
    const rd = kase.resolutionData || {};
    const mayAct = role.id === CLOSER_ROLE;
    const today = new Date().toISOString().slice(0, 10);
    const head = `<div class="card-header"><i class="fa-solid fa-envelope-open-text"></i> แจ้งมติ / ปิดเรื่อง (เรื่องทั่วไป / กกม.)</div>`;
    const resLine = `<p class="mb-2">มติของเรื่องนี้: <strong>${esc(res ? res.label : code)}</strong>
      ${kase.meetingNo ? `<span class="text-muted small ms-2">ครั้งที่ ${esc(kase.meetingNo)}${kase.agendaNo ? ' วาระที่ ' + esc(kase.agendaNo) : ''}</span>` : ''}</p>`;
    const view = html => { host.classList.remove('d-none'); host.innerHTML = `<div class="ws-card mb-3" id="closureCard">${head}<div class="card-body">${resLine}${html}</div></div>`; };
    const noRight = `<div class="no-permission"><i class="fa-solid fa-lock me-1"></i>ผู้ดำเนินการคือกลุ่มงานกิจการคณะกรรมการ — บทบาทของคุณดูได้อย่างเดียว</div>`;
    const val = id => (document.getElementById(id) || {}).value ? document.getElementById(id).value.trim() : '';

    async function go(toStatus, patch, eventType, confirmTitle, confirmHtml) {
      const gate = ECMIS.canTransition(kase.status, toStatus, Object.assign({}, kase, patch, { actorRoleId: role.id }));
      if (!gate.ok) { ECMIS.toastWarn('ดำเนินการยังไม่ได้: ' + (gate.guards || [gate.reason]).join(' / ')); return; }
      const r = await ECMIS.confirmAction({ title: confirmTitle, html: confirmHtml, confirmText: 'ยืนยัน' });
      if (!r || !r.isConfirmed) return;
      const from = kase.status;
      const merged = Object.assign({}, kase.resolutionData || {}, patch);
      try {
        if (sb && kase.trr_id) {
          const { error } = await sb.from('tbl_res_request')
            .update({ trr_status: ECMIS.STATUS_CODE[toStatus], trr_resolution_data: merged }).eq('trr_id', kase.trr_id);
          if (error) throw error;
          await ECMIS.logRequestEvent(kase.trr_id, from, toStatus, { type: eventType, actorRole: role.id, data: patch });
        }
      } catch (e) { console.error(e); ECMIS.toastWarn('บันทึกลงฐานข้อมูลไม่สำเร็จ: ' + e.message); return; }
      kase.status = toStatus; kase.resolutionData = merged; Object.assign(kase, patch);
      ECMIS.toastOk('บันทึกเรียบร้อย'); setTimeout(() => location.reload(), 900);
    }

    if (kase.status === 'CLOSED') {
      const lines = [];
      if (rd.notifyLetterNo73) lines.push(`แจ้งมติถึง ${esc(rd.notifyTo73 || '')} หนังสือ ${esc(rd.notifyLetterNo73)}${rd.notifyDate73 ? ' วันที่ ' + esc(ECMIS.thaiDate(ECMIS.toBuddhistFakeIso(rd.notifyDate73))) : ''}`);
      if (rd.appointOrderNo73) lines.push(`คำสั่งแต่งตั้งเลขที่ ${esc(rd.appointOrderNo73)}`);
      if (rd.legalOpinion73) lines.push(`ความเห็นกองกฎหมาย: ${esc(rd.legalOpinion73)}`);
      view(`<div class="alert alert-success py-2 mb-0"><i class="fa-solid fa-circle-check me-1"></i>ปิดเรื่องแล้ว${lines.length ? '<ul class="mb-0 mt-1 small">' + lines.map(l => `<li>${l}</li>`).join('') + '</ul>' : ''}</div>`);
      return true;
    }

    if (kase.status === 'DISPATCHING') {
      if (!mayAct) { view(`<div class="alert alert-warning py-2 mb-2">ส่งกองกฎหมายแล้ว (หนังสือ ${esc(rd.legalLetterNo73 || '-')}) — รอความเห็น</div>${noRight}`); return true; }
      view(`<div class="alert alert-warning py-2"><i class="fa-solid fa-scale-balanced me-1"></i>ส่งกองกฎหมายแล้ว หนังสือ <strong>${esc(rd.legalLetterNo73 || '-')}</strong> — รอความเห็น</div>
        <div class="row g-2">
          <div class="col-md-8"><label class="form-label field-req">สรุปความเห็นกองกฎหมาย</label><textarea class="form-control" id="c73Opinion" rows="2"></textarea></div>
          <div class="col-md-4"><label class="form-label">เลขหนังสือตอบ</label><input class="form-control" id="c73OpinionNo"></div>
        </div>
        <div class="d-flex flex-wrap gap-2 mt-3">
          <button type="button" class="btn btn-navy btn-sm" id="c73Reagenda"><i class="fa-solid fa-calendar-plus me-1"></i>เสนอเข้าวาระใหม่</button>
          <button type="button" class="btn btn-outline-navy btn-sm" id="c73LegalClose"><i class="fa-solid fa-folder-closed me-1"></i>ปิดเรื่อง</button>
        </div>`);
      const patch = () => ({ legalOpinion73: val('c73Opinion'), legalOpinionNo73: val('c73OpinionNo') });
      document.getElementById('c73Reagenda').addEventListener('click', () => {
        if (!val('c73Opinion')) { ECMIS.toastWarn('กรุณาสรุปความเห็นกองกฎหมายก่อน'); return; }
        go('AGENDA_SET', Object.assign(patch(), { reagendaPending: true, reagendaReason: 'ได้รับความเห็นกองกฎหมายแล้ว — เสนอเข้าวาระใหม่', previousResolution: { code, label: res ? res.label : code, meetingNo: kase.meetingNo || '', agendaNo: kase.agendaNo || '' } }),
          'LEGAL_OPINION_REAGENDA_73', 'ยืนยันเสนอเข้าวาระใหม่', `<p>สำนวน <strong>${esc(kase.id)}</strong> จะกลับเข้าคิวรอบรรจุวาระของฝ่ายเลขานุการบอร์ด</p>`);
      });
      document.getElementById('c73LegalClose').addEventListener('click', () => {
        if (!val('c73Opinion')) { ECMIS.toastWarn('กรุณาสรุปความเห็นกองกฎหมายก่อน'); return; }
        go('CLOSED', patch(), 'LEGAL_OPINION_CLOSE_73', 'ยืนยันปิดเรื่อง', `<p>สำนวน <strong>${esc(kase.id)}</strong> — ปิดเรื่องตามความเห็นกองกฎหมาย</p>`);
      });
      return true;
    }

    /* RESOLVED */
    if (!mayAct) { view(noRight); return true; }
    if (code === 'LEGAL_DIVISION_73') {
      view(`<div class="row g-2">
          <div class="col-md-6"><label class="form-label field-req">เลขหนังสือส่งกองกฎหมาย</label><input class="form-control" id="c73LegalNo"></div>
          <div class="col-md-6"><label class="form-label">วันที่ส่ง</label><input type="date" class="form-control" id="c73LegalDate" value="${today}"></div>
        </div>
        <div class="mt-3"><button type="button" class="btn btn-navy btn-sm" id="c73SendLegal"><i class="fa-solid fa-scale-balanced me-1"></i>บันทึกส่งกองกฎหมาย — รอความเห็น</button></div>`);
      document.getElementById('c73SendLegal').addEventListener('click', () => {
        if (!val('c73LegalNo')) { ECMIS.toastWarn('กรุณาระบุเลขหนังสือส่งกองกฎหมาย'); return; }
        go('DISPATCHING', { legalLetterNo73: val('c73LegalNo'), legalSentDate73: val('c73LegalDate') }, 'SEND_LEGAL_73',
          'ยืนยันส่งกองกฎหมาย', `<p>สำนวน <strong>${esc(kase.id)}</strong> หนังสือ ${esc(val('c73LegalNo'))}</p>`);
      });
      return true;
    }
    const withOrder = ['APPROVE_73', 'SPECIAL_TASK_73'].includes(code);
    view(`<div class="row g-2">
        <div class="col-md-6"><label class="form-label field-req">ส่งเอกสารให้ (ผู้รับผิดชอบ / หน่วยงาน)</label><input class="form-control" id="c73To" placeholder="เช่น กองกฎหมาย / สำนักงาน ป.ป.ท. เขต 1"></div>
        <div class="col-md-3"><label class="form-label field-req">เลขหนังสือแจ้งมติ</label><input class="form-control" id="c73No"></div>
        <div class="col-md-3"><label class="form-label">วันที่แจ้ง</label><input type="date" class="form-control" id="c73Date" value="${today}"></div>
        ${withOrder ? `<div class="col-md-6"><label class="form-label">เลขที่คำสั่งแต่งตั้ง (ถ้ามี — คณะอนุกรรมการ / คณะทำงาน)</label><input class="form-control" id="c73Order"></div>` : ''}
        <div class="col-12"><label class="form-label">หมายเหตุ</label><input class="form-control" id="c73Note"></div>
      </div>
      <div class="mt-3"><button type="button" class="btn btn-navy btn-sm" id="c73Close"><i class="fa-solid fa-folder-closed me-1"></i>ส่งเอกสารและปิดเรื่อง</button></div>`);
    document.getElementById('c73Close').addEventListener('click', () => {
      if (!val('c73To') || !val('c73No')) { ECMIS.toastWarn('กรุณาระบุผู้รับเอกสารและเลขหนังสือแจ้งมติ'); return; }
      go('CLOSED', { notifyTo73: val('c73To'), notifyLetterNo73: val('c73No'), notifyDate73: val('c73Date'), appointOrderNo73: val('c73Order'),
        closure: { closedAt: new Date().toISOString(), note: val('c73Note'), by: role.id } },
        'NOTIFY_CLOSE_73', 'ยืนยันส่งเอกสารและปิดเรื่อง', `<p>สำนวน <strong>${esc(kase.id)}</strong> ส่งเอกสารให้ ${esc(val('c73To'))}</p>`);
    });
    return true;
  }

  g.CaseClosure = { mount, applies, applies73, resCode };
})(window);
