/* ==========================================================================
   handoff.js — สัญญาการส่งต่อ (interface contract) ระหว่างกิจกรรม
   ต้องโหลดหลัง cases.js

   เดิมท่อแต่ละเส้นทำแค่ saveCase(patch) + location.href ทำให้ contract ที่ตกลงกันไว้
   13 ฟิลด์ ขาดไป 8 ฟิลด์ (Trigger, เอกสารที่ส่ง, สถานะเมื่อปลายทางรับ,
   Acknowledgement/เลขรับ/ผู้รับ, Reject reason, Revision, SLA)
   ไฟล์นี้ทำให้ทุกลูกศรข้ามกิจกรรมส่ง envelope ชุดเดียวกันครบทั้ง 13 ฟิลด์

   envelope:
     from, to            กิจกรรมต้นทาง/ปลายทาง (key โฟลเดอร์ หรือ external:*)
     trigger             เหตุที่ทำให้เกิดการส่ง
     caseId              เลขสำนวน
     docs[]              รายการเอกสาร/ข้อมูลที่ส่งไปด้วย
     statusBefore        สถานะก่อนส่ง
     statusAfter         สถานะที่ปลายทางควรเป็นเมื่อรับแล้ว
     ack{no,at,by}       เลขรับ / วันเวลา / ผู้รับ — ปลายทางเป็นคนประทับ (receive)
     returnReason        เหตุที่ตีกลับ (เฉพาะเส้น return)
     revision            รอบที่ส่ง (นับขึ้นทุกครั้งที่ตีกลับแล้วส่งใหม่)
     slaDue              กำหนดเวลาที่ปลายทางต้องดำเนินการ
     action              ข้อความสรุปเหตุการณ์ (ลง audit trail)
   ========================================================================== */
(function(){
  "use strict";
  var Hub = window.ECMISHub;
  if (!Hub){ console.warn("[handoff] ไม่พบ ECMISHub — ต้องโหลด cases.js ก่อน"); return; }

  var ACT_TH = {
    "intake-investigation":"กระบวนการรับเรื่องและไต่สวน", "witness-protection":"ก6 คุ้มครองพยาน",
    "board-resolution":"กระบวนการมติบอร์ด", "person-screening":"ก8 ตรวจสอบประวัติบุคคล",
    "arrest-warrant":"ก9 หมายจับ", "legal-case":"ก10 กฎหมายในทางคดี",
    "analytics":"ก12 วิเคราะห์และรายงานผล", "integration-gateway":"ก13 เชื่อมโยงข้อมูล",
    "admin-center":"ก14 บริหารกลาง",
    "external:prosecutor":"พนักงานอัยการ (ภายนอกระบบ)",
    "external:court":"ศาล (ภายนอกระบบ)",
    "external:got":"กองปฏิบัติการพิเศษ กอท.",
    "external:agency":"ต้นสังกัด/หน่วยงานตามมติ (ภายนอกระบบ)",
    "external:nacc":"สำนักงาน ป.ป.ช. (ภายนอกระบบ)"
  };
  function actName(k){ return ACT_TH[k] || k || "-"; }
  function isExternal(k){ return String(k || "").indexOf("external:") === 0; }
  var ACT_ENTRY = {
    "board-resolution": "board-resolution/inbox.html",
    "legal-case": "legal-case/01-work-inbox.html"
  };

  /* ---- เลขรับ mock: ปปท-YY-NNNN เรียงตามจำนวน ack ที่ออกไปแล้ว ---- */
  function nextAckNo(){
    var n = 0;
    try{ n = Hub.getEvents().filter(function(e){ return e.ack && e.ack.no; }).length; }catch(e){}
    var yy = String(new Date().getFullYear() + 543).slice(-2);
    return "ปปท-" + yy + "-" + String(1001 + n);
  }

  /* ---- revision: นับจากจำนวนครั้งที่เคยส่งเส้นเดียวกันมาก่อน ---- */
  function nextRevision(caseId, from, to){
    try{
      var n = Hub.getEvents(caseId).filter(function(e){ return e.from === from && e.to === to; }).length;
      return n + 1;
    }catch(e){ return 1; }
  }

  /* ---- ส่งต่อ ---- */
  function send(spec){
    var caseId = Hub.normId(spec.caseId || Hub.activeCaseId());
    var env = {
      action:       spec.action || ("ส่งต่อ " + actName(spec.from) + " → " + actName(spec.to)),
      from:         spec.from,
      to:           spec.to,
      trigger:      spec.trigger || "",
      caseId:       caseId,
      docs:         spec.docs || [],
      statusBefore: spec.statusBefore || (Hub.getCase(caseId) || {}).status || "",
      statusAfter:  spec.statusAfter || "",
      returnReason: spec.returnReason || "",
      revision:     spec.revision != null ? spec.revision : nextRevision(caseId, spec.from, spec.to),
      slaDue:       spec.slaDue || "",
      ack:          null,          // ปลายทางประทับตอน receive()
      by:           spec.by || actName(spec.from),
      note:         spec.note || "",
      junctionId:   spec.junctionId || "",
      payload:      spec.payload || null
    };

    // อัปเดตทะเบียนกลาง: ทั้ง field เฉพาะเส้น และสถานะ "กำลังรอปลายทางรับ"
    // pendingByTo: ปลายทางละหนึ่งช่อง เพื่อให้งานคู่ขนาน (เช่น ก6 ระหว่างรอ ก7) ไม่ทับกัน
    // pending: คงไว้ให้โค้ดเดิมที่อ่านช่องเดียว (ชี้ไปที่การส่งล่าสุด)
    var pendingEntry = {
      to: spec.to, statusAfter: env.statusAfter, since: new Date().toISOString(),
      trigger: env.trigger, docs: env.docs, revision: env.revision,
      returnReason: env.returnReason, slaDue: env.slaDue, from: spec.from,
      junctionId: env.junctionId, payload: env.payload
    };
    var patch = Object.assign({ id: caseId }, spec.patch || {});
    patch.pendingByTo = Object.assign({}, (Hub.getCase(caseId) || {}).pendingByTo);
    patch.pendingByTo[pendingKey(spec.to, env.junctionId)] = pendingEntry;
    patch.pending = pendingEntry;
    // งานคู่ขนาน (คุ้มครองพยาน/หมายจับ) ไม่เปลี่ยนสถานะหลักของสำนวน
    if (env.statusAfter && !spec.keepStatus) patch.status = env.statusAfter;
    if (!Hub.saveCase(patch)) {
      console.error("ส่งต่อไม่สำเร็จ: บันทึกทะเบียนกลางไม่ได้ (พื้นที่จัดเก็บในเบราว์เซอร์อาจเต็ม)", caseId, spec.to, env.junctionId);
      return null;
    }
    Hub.addEvent(caseId, env);

    // ส่งจากกลางงาน (เช่น นักสืบส่งคำขอคุ้มครองพยาน) ไม่ต้องพาผู้ใช้ออกจากหน้าเดิม
    if (spec.stay) return env;

    // ปลายทางภายนอกระบบ: ไม่มีหน้าให้ไป — โชว์ package + ให้ผู้ใช้ยืนยันการนำส่ง
    if (isExternal(spec.to)){ showExternal(env); return env; }

    /* ปลายทางอยู่นอกสิทธิ์ของผู้ใช้คนนี้ → ไม่ย้ายหน้า
       ไม่ใช่แค่เรื่องสิทธิ์ แต่ตรงกับงานจริงด้วย: คนส่งไม่ได้นั่งทำงานในคิวของปลายทาง
       ส่งเสร็จก็จบหน้าที่ รอปลายทางเปิดเอง (แล้วระบบจะประทับเลขรับตอนนั้น) */
    var A = window.ECMISAuth;
    if (A && A.getAuth() && !A.canSee(spec.to)){ showQueued(env); return env; }

    var target = spec.target || ACT_ENTRY[spec.to] || (spec.to + "/index.html");
    var sep = target.indexOf("?") === -1 ? "?" : "&";
    location.href = "../" + target + sep + "case=" + encodeURIComponent(caseId) + (spec.hash || "");
    return env;
  }

  /* ช่องรอรับแยกตาม "ปลายทาง|รอยต่อ" เพราะเคสเดียวอาจมีหลายเรื่องส่งไปปลายทางเดียวกันพร้อมกัน */
  function pendingKey(to, junctionId){ return junctionId ? to + "|" + junctionId : to; }
  function pendingEntries(kase, activityKey, junctionId){
    var list = [];
    Object.keys((kase && kase.pendingByTo) || {}).forEach(function(key){
      var entry = kase.pendingByTo[key];
      if (entry && entry.to === activityKey && (!junctionId || entry.junctionId === junctionId)) list.push({ key: key, entry: entry });
    });
    if (!list.length && kase && kase.pending && kase.pending.to === activityKey && (!junctionId || kase.pending.junctionId === junctionId)) list.push({ key: null, entry: kase.pending });
    return list;
  }

  /* ---- ปลายทางรับ: ประทับ ack + ปิด pending (ระบุ junctionId เพื่อปิดเฉพาะเรื่องนั้น) ---- */
  function receive(caseId, activityKey, receiver, junctionId){
    caseId = Hub.normId(caseId || Hub.activeCaseId());
    var kase = Hub.getCase(caseId);
    if (!kase) return null;
    var found = pendingEntries(kase, activityKey, junctionId);
    if (!found.length) return null;

    var byTo = Object.assign({}, kase.pendingByTo), ack = null;
    found.forEach(function(item){
      var entry = item.entry;
      ack = { no: nextAckNo(), at: new Date().toISOString(), by: receiver || actName(activityKey) };
      Hub.addEvent(caseId, {
        action: "ปลายทางรับเรื่องแล้ว", from: entry.from, to: activityKey,
        trigger: "ปลายทางเปิดสำนวน", caseId: caseId,
        statusBefore: entry.statusAfter || kase.status || "",
        statusAfter: entry.statusAfter || kase.status || "",
        revision: entry.revision, ack: ack, by: ack.by, junctionId: entry.junctionId || "",
        note: "ประทับเลขรับอัตโนมัติเมื่อปลายทางเปิดสำนวนครั้งแรก"
      });
      if (item.key) delete byTo[item.key];
    });
    var remaining = Object.keys(byTo);
    Hub.saveCase({ id: caseId, pendingByTo: byTo, pending: remaining.length ? byTo[remaining[remaining.length - 1]] : null,
      receivedBy: activityKey, lastAck: ack });
    return ack;
  }

  /* ---- envelope ขาเข้าล่าสุดที่จ่าหน้าถึงกิจกรรมนี้ (ใช้อ่าน payload ของผล/คำขอ) ---- */
  function inbound(caseId, activityKey, junctionId){
    caseId = Hub.normId(caseId || Hub.activeCaseId());
    var list = Hub.getEvents(caseId).filter(function(e){
      return e.to === activityKey && e.action !== "ปลายทางรับเรื่องแล้ว" && (!junctionId || e.junctionId === junctionId);
    });
    return list[0] || null;
  }

  /* ---- package สำหรับปลายทางภายนอกระบบ ---- */
  function showExternal(env){
    var rows = [
      ["ต้นทาง", actName(env.from)],
      ["ปลายทาง", actName(env.to)],
      ["เลขสำนวน", env.caseId],
      ["เหตุที่ส่ง (trigger)", env.trigger || "-"],
      ["เอกสารที่นำส่ง", (env.docs || []).length ? env.docs.join("<br>") : "-"],
      ["สถานะก่อนส่ง", env.statusBefore || "-"],
      ["สถานะเมื่อปลายทางรับ", env.statusAfter || "-"],
      ["รอบที่ส่ง (revision)", env.revision],
      ["SLA", env.slaDue || "-"]
    ];
    if (env.returnReason) rows.push(["เหตุที่ตีกลับ", env.returnReason]);
    var html = '<table style="width:100%;font-size:12.5px;text-align:left;border-collapse:collapse">'
      + rows.map(function(r){ return row(r[0], r[1]); }).join("")
      + '</table>'
      + '<p style="margin:10px 0 0;font-size:11.5px;color:#8a6111;background:#fff6df;border:1px solid #e3c77e;border-radius:7px;padding:8px 10px;text-align:left">'
      + 'ปลายทางอยู่นอกระบบ E-CMIS — ระบบบันทึกการนำส่งไว้ในเส้นทางเคสแล้ว '
      + 'หลักฐานการรับ (เลขรับ/วันเวลา/ผู้รับ) ต้องบันทึกกลับเมื่อได้รับใบตอบรับ</p>';

    if (window.Swal){
      Swal.fire({ title: "นำส่ง " + actName(env.to), html: html, width: 620,
        icon: "success", confirmButtonColor: "#0d1b3e", confirmButtonText: "รับทราบ",
        customClass: { popup: "ecmis-swal" } });
    } else {
      alert("นำส่ง " + actName(env.to) + " — เคส " + env.caseId + " (บันทึกในเส้นทางเคสแล้ว)");
    }
  }

  /* ---- ส่งแล้วแต่เราไม่มีสิทธิ์เข้าไปดูปลายทาง ---- */
  function showQueued(env){
    var A = window.ECMISAuth;
    var owners = (A && A.ownersOf) ? A.ownersOf(env.to) : [];
    var who = owners.length
      ? owners.map(function(o){ return "<code>" + o.u + "</code> — " + o.name; }).join("<br>")
      : "ผู้ที่มีสิทธิ์ในกิจกรรมนั้น";
    var docs = (env.docs || []).length ? env.docs.join("<br>") : "-";
    var html =
        '<table style="width:100%;font-size:12.5px;text-align:left;border-collapse:collapse">'
      + row("เลขสำนวน", env.caseId) + row("ส่งไปที่", actName(env.to))
      + row("เอกสารที่นำส่ง", docs) + row("สถานะเมื่อปลายทางรับ", env.statusAfter || "-")
      + row("รอบที่ส่ง", env.revision) + row("SLA", env.slaDue || "-")
      + (env.returnReason ? row("เหตุที่ตีกลับ", env.returnReason) : "")
      + row("ผู้ที่จะรับเรื่อง", who)
      + '</table>'
      + '<p style="margin:10px 0 0;font-size:11.5px;color:#52657c;background:#eef4fb;border:1px solid #d6e0ea;border-radius:7px;padding:8px 10px;text-align:left">'
      + 'บันทึกการส่งไว้แล้ว — ระบบจะประทับเลขรับอัตโนมัติเมื่อปลายทางเปิดสำนวน '
      + 'สลับผู้ใช้เพื่อดูฝั่งรับได้ หรือใช้ <code>demo / demo</code> เพื่อเดินดูทั้งสาย</p>';
    if (window.Swal){
      Swal.fire({ title:"ส่งเรียบร้อย — รอ " + actName(env.to) + " รับเรื่อง", html:html, width:600,
        icon:"success", confirmButtonColor:"#0d1b3e", confirmButtonText:"รับทราบ",
        customClass:{popup:"ecmis-swal"} });
    } else {
      alert("ส่งเรียบร้อย — รอ " + actName(env.to) + " รับเรื่อง (เคส " + env.caseId + ")");
    }
  }
  function row(k,v){
    return '<tr><th style="width:38%;padding:6px 8px;background:#f3f6fa;color:#52657c;font-weight:500;vertical-align:top">'
         + k + '</th><td style="padding:6px 8px;border-top:1px solid #e5eaf0">' + v + '</td></tr>';
  }

  window.ECMISHandoff = {
    ACT_TH: ACT_TH, actName: actName, isExternal: isExternal,
    send: send, receive: receive, inbound: inbound, pendingEntries: pendingEntries, pendingKey: pendingKey, showQueued: showQueued, nextAckNo: nextAckNo, nextRevision: nextRevision
  };
})();
