/* ==========================================================================
   junction-bridge-a7.js — ศูนย์มติ (ก7) รับเรื่องจากทะเบียนกลางและส่งผลมติกลับ
   โหลดหลัง ../cases.js, ../shared-assets/handoff.js, ../shared-assets/junctions.js และ assets/ecmis-app.js
   ต้องอยู่ก่อนสคริปต์ในหน้าที่วาดคิว เพื่อให้เรื่องที่ส่งมาเห็นในคิวทันที

   รับเข้า: 213 (J02 → 7-1), 644 (J04 → 7-2), คุ้มครองพยาน (J07B → 7-3),
            เรื่องกฎหมาย (J12 → 7-3), ผลติดตามวินัย (J13 → 7-3)
   ส่งออก: J03 / J05 กลับ ก5, J07C กลับ ก5, J12R กลับ ก10,
           J10 ไป ก8 (วินัย/ติดตาม), J11 ไป ก10 (มติทางกฎหมาย/อัยการ)
   ========================================================================== */
(function(root){
  "use strict";

  var HERE = "board-resolution";
  var PROC = { "213": "7.1", "644": "7.2", GENERAL: "7.3" };
  var LEGAL_73 = ["REVIEW_PROSECUTOR_73", "LEGAL_DIVISION_73", "KKM_NO_APPEAL", "KKM_NO_DIKA", "KKM_DISAGREE_AG", "KKM_OTHER"];
  var A5_644_LABELS = {
    ADDITIONAL_644: "ให้ไต่สวนเพิ่มเติม", CRIMINAL_DISCIPLINARY: "ชี้มูลอาญาและ/หรือวินัย", SECTION_18_4: "ดำเนินการตาม ม.18/4",
    DISCIPLINARY_ONLY: "ชี้มูลวินัยอย่างเดียว", NO_GROUNDS: "ข้อกล่าวหาไม่มีมูล", PROSECUTION_EXTINGUISHED: "คดีขาดอายุความ",
    SEND_NACC: "ส่งสำนักงาน ป.ป.ช.", SEND_POLICE: "ส่งพนักงานสอบสวน"
  };
  var A5_213_FORWARD = { SEND_NACC: "ส่งสำนักงาน ป.ป.ช.", SEND_POLICE: "ส่งพนักงานสอบสวน", SEND_DISCIPLINE_AGENCY: "ส่งต้นสังกัดดำเนินการทางวินัย" };
  var WITNESS_A7 = { APPROVED: "อนุมัติมาตรการ", REJECTED: "ไม่อนุมัติ", UPHOLD_ORDER: "ยืนตามคำสั่งเดิม", RESTORE_PROTECTION: "คืนสิทธิคุ้มครอง",
    APPROVE_EXTERNAL_TRANSFER: "อนุมัติส่งหน่วยงานภายนอก", NEED_MORE_INFO: "ขอข้อมูลเพิ่มเติม" };

  function text(v){ return String(v == null ? "" : v).trim(); }
  function J(){ return root.ECMISJunctions && root.ECMISJunctions.isAvailable() ? root.ECMISJunctions : null; }
  function ecmis(){ return root.ECMIS || null; }
  function todayBE(){
    var d = new Date(), y = d.getFullYear() + 543;
    return y + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  /* ---------- เก็บเรื่องที่รับจากกิจกรรมอื่นข้าม session ----------
     CASES ของ ก7 อยู่ใน sessionStorage ของแท็บ เปิดแท็บใหม่แล้วเรื่องที่รับไปแล้วจะหาย
     (ช่องรอรับถูกเคลียร์ตอนรับ ดึงซ้ำไม่ได้) จึงเก็บเฉพาะเรื่องที่มี junction ไว้ใน localStorage */
  var STORE_KEY = "ecmis-a7-junction-cases-v1";
  function readStore(){ try { var v = JSON.parse(root.localStorage.getItem(STORE_KEY) || "[]"); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
  function persistLinked(){
    var E = ecmis();
    if (!E || !Array.isArray(E.CASES)) return;
    var linked = E.CASES.filter(function(c){ return c && c.junction; });
    var others = readStore().filter(function(s){ return !linked.some(function(c){ return c.id === s.id; }); });
    try { root.localStorage.setItem(STORE_KEY, JSON.stringify(linked.concat(others))); } catch (e) {}
  }
  function reportResult(kase){
    return { resolution: kase.resolution, resolution72: kase.resolution72, resolutionStage: kase.resolutionStage,
      resolutionData: kase.resolutionData, recordedDocHtml: kase.recordedDocHtml, resolvedAtIso: kase.resolvedAtIso };
  }
  function emptyReportWorkflow() {
    var fields = { signedByChair: false, signedBySecgen: false, signedBySubSec: false, signedBySubSec72: false, _pendingSig: null };
    ["chairSignedAt", "chairNote", "secgenSignedAt", "secgenOpinion", "meetingNo", "meetingDate", "agendaNo",
      "subCommittee", "supportTeam", "supportTeam72", "supportOpinion", "supportOpinion72", "supportDecision", "supportDecision72",
      "screeningMeetNo", "screeningMeetDate", "screeningMeetNo72", "screeningMeetDate72", "screeningOpinion72",
      "subMeetingNo", "subMeetingDate", "subSecSignerName", "subSecSignerTitle", "subSecSignedAt",
      "subMeetingNo72", "subMeetingDate72", "subSecSignerName72", "subSecSignerTitle72", "subSecSignedAt72",
      "chairmanReturnReason72", "returnReason72", "returnNote72", "returnedBy72"].forEach(key => { fields[key] = ""; });
    return fields;
  }
  function emptyReportResult(){
    return { resolution: '', resolution72: '', resolutionStage: null, resolutionData: {}, recordedDocHtml: null, resolvedAtIso: null };
  }
  function restoreLinked(){
    var E = ecmis();
    if (!E || !Array.isArray(E.CASES)) return 0;
    var count = 0;
    readStore().forEach(function(saved){
      var old213Result = saved.junction?.id === 'J04' && saved.docType === '644' && ['ACCEPT_S24P1', 'ACCEPT_S24P3'].includes(saved.resolution);
      if (old213Result) {
        saved.junctionHistory = (saved.junctionHistory || []).concat([{ docType: '213', result: reportResult(saved) }]);
        Object.assign(saved, emptyReportResult());
      }
      var legacy644 = saved.junction?.id === 'J04' && saved.docType === '644' && saved.status === 'PENDING_SECGEN';
      if (legacy644) saved.status = 'PENDING_SECGEN_72';
      Object.assign(saved, sourceMetadata(saved.junction?.payload));
      var existing = E.CASES.filter(function(c){ return c.id === saved.id; })[0];
      if (existing && existing.junction) {
        Object.assign(existing, saved);
        count++;
        return;
      }
      // เปิดด้วย ?case= ในแท็บใหม่ ecmis-app ใส่ข้อมูลดิบจากทะเบียนกลางไว้ก่อน ให้แทนด้วยฉบับของ ก7
      if (existing) Object.keys(existing).forEach(function(k){ delete existing[k]; });
      if (existing) Object.assign(existing, saved); else E.CASES.push(saved);
      count++;
    });
    return count;
  }
  function wrapSave(){
    var E = ecmis();
    if (!E || typeof E.saveCases !== "function" || E.saveCases.__junctionWrapped) return;
    var original = E.saveCases;
    var wrapped = function(){ var out = original.apply(this, arguments); publishProgress(); persistLinked(); return out; };
    wrapped.__junctionWrapped = true;
    if (root.saveCases === original) root.saveCases = wrapped;
    E.saveCases = wrapped;
  }

  /* ---------- รับเข้า ---------- */
  function sourceDates(payload) {
    var dates = {}, context = Object.assign({}, payload?.caseContext || {});
    var firstReceived = root.ECMISHub?.getCase?.(payload?.sourceCaseId || payload?.caseNumber)?.receivedAt;
    if (!context.receivedDateISO && /^\d{4}-\d{2}-\d{2}$/.test(firstReceived || "")) {
      context.receivedDateISO = firstReceived;
      context.deadline2yISO = String(Number(firstReceived.slice(0,4)) + 2) + firstReceived.slice(4);
    }
    Object.entries({ receivedDate: context.receivedDateISO, deadline60: context.deadline60ISO, deadline2y: context.deadline2yISO }).forEach(function(pair){
      if (/^\d{4}-\d{2}-\d{2}$/.test(pair[1] || "")) dates[pair[0]] = String(Number(pair[1].slice(0,4)) + 543) + pair[1].slice(4);
    });
    return dates;
  }
  function sourceMetadata(payload) {
    var p = payload || {}, report = p.reportSnapshot?.payload || {};
    var result = {};
    var owner = text(p.owner || report.documentMeta?.responsibleOfficer?.displayName);
    if (owner) result.owner = owner;
    if (text(p.legalBase)) result.legalBase = text(p.legalBase);
    if (text(p.destinationUnit || report.documentMeta?.unitName)) result.ownerOrg = text(p.destinationUnit || report.documentMeta.unitName);
    var people = Array.isArray(p.accusedPersons) ? p.accusedPersons : report.accusedPersons;
    if (Array.isArray(people) && people.length) result.accused = people.map(function(person, index) {
      return { no: index + 1, name: text(person.name), pos: text(person.position || person.pos),
        idcard: text(person.idcard), agency: text(person.agency) };
    });
    var allegations = (report.allegations || []).map(row => text(row.summary || row.allegation)).filter(Boolean).join("\n");
    if (text(p.allegation || allegations || p.subject)) result.allegation = text(p.allegation || allegations || p.subject);
    return result;
  }
  function toA7Case(hubCase, entry){
    var p = (entry && entry.payload) || {};
    var docType = text(p.docType) || "GENERAL";
    var accused = text(p.accused || hubCase.accused).split(/\s*,\s*/).filter(Boolean)
      .map(function(name, i){ return { no: i + 1, name: name, pos: "", idcard: "", agency: text(p.agency || hubCase.agency) }; });
    return {
      id: p.requestType ? "a7-request:" + text(hubCase.id) + ":" + text(p.requestId) : text(hubCase.id), subject: text(p.subject || hubCase.subject || hubCase.title), legalBase: text(p.legalBase || hubCase.legalBase),
      status: docType === "644" ? "PENDING_SECGEN_72" : "PENDING_SECGEN", procType: PROC[docType] || "7.3", docType: docType, signPhase: "WAIT",
      owner: text(p.owner || hubCase.owner), ownerOrg: text(p.destinationUnit || hubCase.destinationUnit || hubCase.ownerOrg),
      complainant: text(p.complainant || hubCase.complainant), accused: accused, allegation: text(p.allegation || hubCase.allegation),
      sourceReportHtml: text(p.sourceReportHtml), sourceReportSnapshot: p.reportSnapshot || null, docRef: text(p.letterNo),
      resolution: "", resolution72: "", resolutionStage: null, resolutionData: {}, recordedDocHtml: null, resolvedAtIso: null,
      receivedDate: todayBE(), urgent: false, complex: false, dupWarning: false, subCommittee: null, slaDays: 0,
      slaLimit: docType === "644" ? 15 : 5,
      ...sourceDates(p), ...sourceMetadata(p), junction: { id: entry.junctionId, sourceCaseId: text(hubCase.id), from: entry.from, payload: p, receivedAt: new Date().toISOString() }
    };
  }

  function importPending(){
    var j = J(), E = ecmis();
    if (!j || !E || !Array.isArray(E.CASES)) return 0;
    var imported = [];
    j.pendingFor(HERE).forEach(function(item){
      var incoming = toA7Case(item.kase, item.entry);
      if (!incoming.id) return;
      var existing = E.CASES.filter(function(c){ return c.id === incoming.id; })[0];
      if (existing && text(incoming.junction.payload.submissionPackageId)
        && existing.junction?.id === incoming.junction.id
        && text(existing.junction.payload?.submissionPackageId) === text(incoming.junction.payload.submissionPackageId)
        && Number(existing.junction.payload?.sourceRevision || existing.junction.payload?.reportRevision) === Number(incoming.junction.payload.sourceRevision || incoming.junction.payload.reportRevision)) {
        root.ECMISHandoff.receive(item.kase.id, HERE, "ธุรการกระบวนการมติบอร์ด", item.entry.junctionId);
        return;
      }
      if (existing){
        // ส่งซ้ำรอบใหม่ (เช่น ไต่สวนเพิ่มแล้วเสนอใหม่): เข้าคิวใหม่ แต่คงประวัติและเอกสารเดิมของ ก7
        existing.junctionHistory = (existing.junctionHistory || []).concat(existing.junction ? [{ junction: existing.junction, sourceReportSnapshot: existing.sourceReportSnapshot, sourceReportHtml: existing.sourceReportHtml, result: reportResult(existing), reportWorkflowState: Object.fromEntries(Object.keys(emptyReportWorkflow()).map(key => [key, existing[key]])) }] : []);
        Object.assign(existing, { status: incoming.status, procType: incoming.procType, docType: incoming.docType,
          ...sourceDates(incoming.junction.payload), ...sourceMetadata(incoming.junction.payload), signPhase: "WAIT", junction: incoming.junction, owner: incoming.owner, ownerOrg: incoming.ownerOrg,
          docRef: incoming.docRef, sourceReportHtml: incoming.sourceReportHtml, sourceReportSnapshot: incoming.sourceReportSnapshot }, ["J02", "J04"].includes(incoming.junction.id) ? Object.assign(emptyReportResult(), emptyReportWorkflow()) : {});
        // เคสที่ __hubBridgeCases ดึงมาจากทะเบียนกลางไม่มีช่องที่หน้า ก7 ต้องใช้ (เช่น accused เป็นรายการ)
        Object.keys(incoming).forEach(function(key){
          var value = existing[key];
          if (value === undefined || value === null || value === "" || (key === "accused" && !Array.isArray(value))) existing[key] = incoming[key];
        });
        imported.push(existing);
      } else {
        E.CASES.push(incoming);
        imported.push(incoming);
      }
      root.ECMISHandoff.receive(item.kase.id, HERE, "ธุรการกระบวนการมติบอร์ด", item.entry.junctionId);
    });
    if (imported.length){
      if (typeof E.saveCases === "function") E.saveCases();
      if (typeof E.cacheLiveCases === "function") E.cacheLiveCases(imported);
    }
    return imported.length;
  }

  function applyLinkedCase(live){
    if (!live) return live;
    var E = ecmis(), saved = E && E.CASES && E.CASES.find(function(c){ return c.id === live.id && c.junction; });
    if (!saved) saved = readStore().find(function(c){ return c.id === live.id && c.junction; });
    if (!saved) return live;
    var result = Object.assign({}, live, saved, sourceDates(saved.junction?.payload), sourceMetadata(saved.junction?.payload), { trr_id: live.trr_id, tcc_id: live.tcc_id });
    if (result.junction?.id === 'J04' && !text(result.resolution72)
      && ['RESOLVED_PENDING_72', 'PENDING_SIGN_RULING_72', 'PENDING_AREA_NOTICE_72', 'PENDING_DISPATCH_GUILTY_72', 'DISPATCHING_NACC_72'].includes(result.status)
      && text(live.resolution72 || live.code)) result.resolution72 = live.resolution72 || live.code;
    if (result.junction?.id === 'J04' && text(result.resolution72)) {
      if (!text(result.resolution)) result.resolution = result.resolution72;
      if (typeof E?.computeResolutionStage === 'function') result.resolutionStage = E.computeResolutionStage(result);
    }
    if (result.junction?.id === 'J04' && result.status === 'PENDING_DISPATCH_GUILTY_72' && !text(result.resolution72)) result.resolutionStage = 4;
    return result;
  }
  function mergeLinkedCases(list){
    var merged = new Map((list || []).map(c => [c.id, c]));
    (ecmis()?.CASES || []).filter(c => c.junction).forEach(c => { if (!merged.has(c.id)) merged.set(c.id, c); });
    return Array.from(merged.values());
  }
  function wrapCaseProjection(){
    var E = ecmis();
    if (!E || typeof E.supabaseRowToCase !== "function" || E.supabaseRowToCase.__junctionWrapped) return;
    var original = E.supabaseRowToCase;
    var wrapped = function(){ return applyLinkedCase(original.apply(this, arguments)); };
    wrapped.__junctionWrapped = true;
    E.supabaseRowToCase = wrapped;
  }

  /* ---------- ส่งออก ---------- */
  function choose(title, options){
    if (!root.Swal) return Promise.resolve("");
    return root.Swal.fire({ title: title, input: "select", inputOptions: options, inputPlaceholder: "เลือก",
      confirmButtonText: "ยืนยัน", confirmButtonColor: "#0d1b3e", showCancelButton: false, allowOutsideClick: false,
      inputValidator: function(v){ return v ? null : "ต้องเลือกหนึ่งรายการ"; } }).then(function(r){ return text(r.value); });
  }

  function send(id, kase, payload, by){
    var j = J();
    if (!j) return null;
    return j.send(id, { caseId: kase.id, by: by || "คณะกรรมการ ป.ป.ท.", payload: payload });
  }

  function baseResult(kase, info){
    var now = new Date().toISOString();
    return { a7Code: text(info.code), text: text(info.text) || text(info.label), reference: text(info.reference),
      sourceRevision: Number(kase.junction?.payload?.sourceRevision || kase.junction?.payload?.reportRevision || 0),
      submissionPackageId: text(kase.junction?.payload?.submissionPackageId),
      resolutionHtml: text(kase.recordedDocHtml), decidedAt: now, resolutionDocumentVersionId: "G7-RES-" + text(kase.id).replace(/\W+/g, "-") + "-" + Date.now() };
  }

  function disciplineFollowUp(kase, info, a5Code){
    var disciplinary = a5Code === "DISCIPLINARY_ONLY" || (a5Code === "CRIMINAL_DISCIPLINARY" && info.flags && info.flags.disciplinary)
      || (a5Code === "SECTION_18_4" && /discipl|both/i.test(text(info.section184Route)));
    var payload = { resolutionReference: text(info.reference), accused: (kase.accused || []).map(function(a){ return a.name; }).join(", "),
      // หน่วยงานต้นสังกัดของผู้ถูกกล่าวหา ไม่ใช่หน่วยไต่สวน (ownerOrg) เพราะ ก8 ต้องมีหนังสือถึงต้นสังกัด
      agency: text(kase.accused && kase.accused[0] && kase.accused[0].agency) || text(kase.junction && kase.junction.payload && kase.junction.payload.agency),
      subject: text(kase.subject), a5Code: a5Code };
    // ปลายทางเดียวกัน (ก8) ต้องส่งครั้งเดียว ไม่งั้นช่องรอรับของปลายทางจะทับกัน
    var tracks = [];
    if (disciplinary) tracks.push("CHK003");
    if (["CRIMINAL_DISCIPLINARY", "DISCIPLINARY_ONLY", "SECTION_18_4"].indexOf(a5Code) !== -1) tracks.push("CHK002");
    if (tracks.length) send("J10", kase, Object.assign({ tracks: tracks }, payload));
  }

  function sendRequestEvent(kase, prefix, payload) {
    var p = kase.junction.payload;
    return root.ECMISHandoff.send({ caseId: kase.junction.sourceCaseId || p.sourceCaseId, from: HERE, to: "intake-investigation",
      junctionId: kase.junction.id.replace(/^J14/, prefix), by: payload.by || "กระบวนการมติบอร์ด", stay: true, keepStatus: true,
      trigger: prefix === "J15" ? "กิจกรรมที่ 7 แจ้งผลคำขอ" : "กระบวนการมติบอร์ดแจ้งความคืบหน้า",
      docs: prefix === "J15" ? ["มติและเอกสารแจ้งผลคำขอ"] : [],
      payload: Object.assign({ requestType: p.requestType, requestId: p.requestId, sourceRevision: p.sourceRevision,
        submissionPackageId: p.submissionPackageId }, payload) });
  }
  function publishProgress() {
    (ecmis()?.CASES || []).filter(c => c.junction).forEach(function(c) {
      if (c.junction.progressStatus === c.status) return;
      c.junction.progressStatus = c.status;
      var owner = root.ECMIS.STATUS?.[c.status]?.owner || "";
      var label = root.ECMIS.STATUS?.[c.status]?.label || c.status;
      var p = { status: c.status, statusLabel: label, ownerRole: owner, ownerLabel: root.ECMIS.ROLES?.find(r => r.id === owner)?.title || "กระบวนการมติบอร์ด",
        page: root.ECMIS.pageForCase?.(c) || "approval-review.html", a7CaseId: c.id,
        sourceRevision: c.junction.payload?.sourceRevision || c.junction.payload?.reportRevision,
        submissionPackageId: c.junction.payload?.submissionPackageId };
      if (text(c.junction.id).startsWith("J14:")) sendRequestEvent(c, "J16", p);
      else if (["J02", "J04"].includes(c.junction.id)) root.ECMISHandoff.send({ caseId: c.id, from: HERE, to: "intake-investigation",
        junctionId: "J16:" + c.junction.id, trigger: "กระบวนการมติบอร์ดแจ้งความคืบหน้า", docs: [], payload: p, stay: true, keepStatus: true });
    });
  }
  async function publishRequestResult(kase, info, base) {
    var result = { APPROVE_73: "APPROVED", REJECT_73: "REJECTED" }[info.code];
    if (!result) result = await choose("ระบุผลคำขอตามมติที่บันทึก", { APPROVED: "อนุมัติ", REJECTED: "ไม่อนุมัติ", SOURCE_RETURN: "ส่งกลับแก้ไข" });
    if (!result) throw new Error("ยังไม่ได้ระบุผลคำขอ จึงยังไม่ส่งผลกลับกระบวนการไต่สวน");
    if (result === "SOURCE_RETURN") return sendRequestEvent(kase, "J15", Object.assign(base, { kind: "SOURCE_RETURN", reason: base.text }));
    var extra = { result: result, kind: "RESULT" };
    if (kase.junction.payload.requestType === "LATE_REPORT") {
      extra.decisionType = "DIRECTIONS_ONLY";
      if (result === "APPROVED") {
        if (!root.Swal) throw new Error("ไม่สามารถระบุจำนวนวันตามมติได้");
        var answer = await root.Swal.fire({ title: "จำนวนวันเพิ่มเติมตามมติ", input: "number", inputLabel: "ระบุ 0 หากมีข้อสั่งการโดยไม่เพิ่มเวลา",
          inputAttributes: { min: 0, step: 1 }, showCancelButton: false, allowOutsideClick: false, allowEscapeKey: false,
          inputValidator: value => !/^\d+$/.test(value) ? "ระบุจำนวนวันเป็นจำนวนเต็มตั้งแต่ 0" : undefined });
        if (!answer.isConfirmed) throw new Error("ยังไม่ได้ระบุจำนวนวันตามมติ จึงยังไม่ส่งผลกลับกระบวนการไต่สวน");
        extra.grantedDays = Number(answer.value);
        extra.decisionType = extra.grantedDays > 0 ? "GRANT_DAYS" : "DIRECTIONS_ONLY";
      }
    }
    return sendRequestEvent(kase, "J15", Object.assign(base, extra));
  }

  function renderSourceChain(kase) {
    var p = kase.junction?.payload;
    if (!p) return null;
    var escape = value => text(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
    var opinions = p.reviewOpinions || p.requestSnapshot?.opinions || p.requestSnapshot?.payload?.reviews || p.requestSnapshot?.payload?.approvals || [];
    return opinions.map(o => '<li class="done"><span class="tl-dot"></span><div><div class="tl-t">' + escape(o.reviewerRole || o.role || o.tier || 'ความเห็นจากกระบวนการไต่สวน')
      + '</div><div class="tl-m">' + escape(o.reviewerName || o.byName || o.by || 'ผู้ให้ความเห็นต้นทาง') + '</div><p>'
      + escape(o.opinionText || o.opinion || o.decision || o.result) + '</p></div></li>').join('') || '<li>ดูความเห็นและเอกสารฉบับที่เสนอจากกระบวนการไต่สวน</li>';
  }

  function publishResult(kase, info){
    info = info || {};
    if (!J() || !kase) return Promise.resolve(null);
    var origin = kase.junction && kase.junction.id;
    var base = baseResult(kase, info);
    var code = text(info.code);

    if (text(origin).startsWith("J14:")) return publishRequestResult(kase, info, base);
    if (origin === "J02"){
      var go213 = code === "FORWARD" ? choose("มติส่งเรื่อง: ระบุปลายทางให้ระบบไต่สวน", A5_213_FORWARD) : Promise.resolve("");
      return go213.then(function(a5Choice){
        var a5Code = root.ECMISJunctions.map213FromA7(code, { a5Code: a5Choice });
        return send("J03", kase, Object.assign(base, { docType: "213", a5Code: a5Code, destination: A5_213_FORWARD[a5Code] || "" }), info.by);
      });
    }
    if (origin === "J04"){
      var mapped = root.ECMISJunctions.map644FromA7(code, info.flags || {}, {});
      var go644 = mapped ? Promise.resolve(mapped) : choose("มตินี้ต้องระบุผลให้ระบบไต่สวน", A5_644_LABELS);
      return go644.then(function(a5Code){
        var route = a5Code !== "SECTION_18_4" ? Promise.resolve("") : choose("มติ ม.18/4: ระบุเส้นทาง", { CRIMINAL: "อาญา", DISCIPLINARY: "วินัย", BOTH: "อาญาและวินัย" });
        return route.then(function(section184Route){
          var env = send("J05", kase, Object.assign(base, { docType: "644", a5Code: a5Code, section184Route: section184Route,
            flags: info.flags || {} }), info.by);
          disciplineFollowUp(kase, Object.assign({}, info, { section184Route: section184Route }), a5Code);
          return env;
        });
      });
    }
    if (origin === "J07B"){
      var wp = { APPROVE_73: "APPROVED", REJECT_73: "REJECTED" }[code];
      return (wp ? Promise.resolve(wp) : choose("ผลมติคุ้มครองพยาน", WITNESS_A7)).then(function(resultCode){
        var p = kase.junction.payload || {};
        // เรื่องคุ้มครองพยานเข้า ก7 ด้วยเลขเรื่องของตัวเอง ผลต้องกลับไปที่สำนวนต้นทางใน ก5
        return send("J07C", { id: text(p.sourceCaseId) || kase.id }, { requestId: text(p.requestId), resultCode: resultCode, decisionDate: base.decidedAt,
          reference: base.reference || base.a7Code, selectedMeasure: text(p.selectedMeasure) || WITNESS_A7[resultCode], effectivePeriod: text(p.effectivePeriod) || "-",
          text: base.text }, info.by);
      });
    }
    if (origin === "J12") return Promise.resolve(send("J12R", kase, Object.assign(base, { request: kase.junction.payload || {} }), info.by));
    if (origin === "J13") return Promise.resolve(send("J10", kase, Object.assign(base, { tracks: ["BOARD_DECISION"], request: kase.junction.payload || {} }), info.by));

    // เรื่องของ ก7 เอง: มติทางกฎหมายไป ก10, ชี้มูลวินัยไป ก8
    if (LEGAL_73.indexOf(code) !== -1) return Promise.resolve(send("J11", kase, Object.assign(base, { subject: text(kase.subject) }), info.by));
    if (code === "GUILTY_72") disciplineFollowUp(kase, info, info.flags && info.flags.criminal === false ? "DISCIPLINARY_ONLY" : "CRIMINAL_DISCIPLINARY");
    return Promise.resolve(null);
  }

  function publishReturn(kase, info){
    if (!kase || !text(info?.reason)) return null;
    if (text(kase.junction?.id).startsWith('J14:')) return sendRequestEvent(kase, 'J15', Object.assign(baseResult(kase, info), { kind: 'SOURCE_RETURN', reason: info.reason }));
    if (!['J02', 'J04'].includes(kase.junction?.id)) return null;
    var p = kase.junction.payload || {};
    return send(kase.junction.id === 'J04' ? 'J05' : 'J03', kase, { docType: kase.junction.id === 'J04' ? '644' : '213', kind: 'SOURCE_RETURN',
      sourceRevision: Number(p.reportRevision), submissionPackageId: text(p.submissionPackageId),
      reason: text(info.reason), reasonCode: text(info.reasonCode), returnScope: text(info.scope),
      by: text(info.by), returnedAt: new Date().toISOString(), returnId: 'A7-RETURN-' + Date.now() }, info.by);
  }

  /* งานที่ส่งมาจากกิจกรรมอื่นและถึงคิวของบทบาทที่ login อยู่ — คิวปกติเรียงตามเลขสำนวน งานใหม่จึงจมท้ายตาราง */
  var FROM_LABEL = { J02: "รายงาน 213 จากระบบไต่สวน", J04: "รายงาน 644 จากระบบไต่สวน", J07B: "คุ้มครองพยานขออนุมัติ", J12: "เรื่องจากกิจกรรมกฎหมาย", J13: "ผลติดตามวินัย" };
  function incomingForRole(){
    var E = ecmis(), role = "";
    try { role = root.sessionStorage.getItem("ecmis_role") || ""; } catch (e) {}
    if (!E || !E.STATUS || !role) return [];
    return (E.CASES || []).filter(function(c){ return c.junction && E.STATUS[c.status] && E.STATUS[c.status].owner === role; });
  }
  function showIncoming(){
    var list = incomingForRole(), main = document.querySelector("main.app-main") || document.querySelector("main");
    if (!list.length || !main || document.querySelector("[data-jn7-incoming]")) return;
    var E = ecmis();
    var rows = list.map(function(c){
      var page = "approval-review.html";
      try { page = E.pageForCase(c) || page; } catch (e) {}
      return '<li style="margin:.25rem 0"><a href="' + page + "?case=" + encodeURIComponent(c.id) + '"><b>' + text(c.junction.payload?.caseNumber || c.id).replace(/</g, "&lt;") + "</b></a> · "
        + (FROM_LABEL[c.junction.id] || "งานเข้าใหม่") + " · " + String(c.subject || "").replace(/</g, "&lt;") + "</li>";
    }).join("");
    main.insertAdjacentHTML("afterbegin", '<section data-jn7-incoming style="margin:12px 16px;padding:12px 16px;border:1px solid #c9d6e7;border-radius:10px;background:#f4f8fd">'
      + '<b>งานจากกระบวนการอื่นที่รอคุณ (' + list.length + ")</b><ul style=\"margin:.4rem 0 0 1rem;padding:0\">" + rows + "</ul></section>");
  }

  var count = 0;
  try {
    wrapSave();
    if (restoreLinked() && typeof ecmis().saveCases === "function") ecmis().saveCases();
    count = importPending();
    wrapCaseProjection();
    persistLinked();
  } catch (e) { if (root.console) root.console.warn("[junction-a7] import", e); }
  if (root.document){
    if (root.document.readyState === "loading") root.document.addEventListener("DOMContentLoaded", function(){ try { showIncoming(); } catch (e) {} });
    else try { showIncoming(); } catch (e) {}
  }
  root.ECMISJunctionBridgeA7 = { importPending: importPending, mergeLinkedCases: mergeLinkedCases, applyLinkedCase: applyLinkedCase, publishResult: publishResult, publishReturn: publishReturn, toA7Case: toA7Case, renderSourceChain: renderSourceChain, lastImported: count };
})(typeof window !== "undefined" ? window : globalThis);
