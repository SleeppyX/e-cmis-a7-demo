/* ==========================================================================
   junctions.js — รอยต่อข้ามกิจกรรมตามโฟลวรวม ก4–ก10
   ต้องโหลดหลัง cases.js และ handoff.js ถ้าไม่มีสองไฟล์นั้น ทุกฟังก์ชันคืนค่าว่าง
   (หน้าที่รันเดี่ยว เช่น snapshot E-CMIS-A4 จะกลับไปใช้ปุ่มจำลองเดิม)

   ที่มาของกติกา: /Downloads/E-CMIS-โฟลวรวม-กิจกรรม-4-10/อ่านก่อน-โฟลวรวม-กิจกรรม-4-10.md
   - ก6 แทรกได้ทุกช่วงหลังมีเลขสำนวน ไม่ใช่ขั้นบังคับ
   - ก9 เฉพาะสายไต่สวนชี้มูล (644) ที่เป็นคดีอาญาและมีเหตุขอหมาย ห้ามจากไต่สวนเบื้องต้น
   - ก7 เป็นศูนย์มติ: 213 (สาย 7-1), 644 (สาย 7-2), เรื่องทั่วไป (สาย 7-3)
   ========================================================================== */
(function(global){
  "use strict";

  var A4 = "intake-investigation", A6 = "witness-protection", A7 = "board-resolution",
      A8 = "person-screening", A9 = "arrest-warrant", A10 = "legal-case";

  var CATALOG = {
    J01:  { internal: true, from: A4,  to: A4,  trigger: "ศรร. รับไว้และส่งสำนวนเข้ากระบวนการไต่สวน", docs: ["สำนวนรับเรื่อง", "เอกสารต้นฉบับ"], statusAfter: "รอรับสำนวนและมอบหมาย" },
    J02:  { from: A4,  to: A7,  trigger: "ส่งรายงาน 213 เพื่อรับมติคณะกรรมการ ป.ป.ท.", docs: ["รายงาน 213", "สำนวนและเอกสารประกอบ"], statusAfter: "รอผลมติคณะกรรมการ ป.ป.ท. (213)", slaDue: "30 วันก่อนประชุม", docType: "213" },
    J03:  { from: A7,  to: A4,  trigger: "คณะกรรมการ ป.ป.ท. มีมติรายงาน 213", docs: ["มติคณะกรรมการ", "คำสั่ง/หนังสือแจ้งมติ"], statusAfter: "ได้รับผลมติ 213" },
    J04:  { from: A4,  to: A7,  trigger: "ส่งรายงาน 644 เพื่อวินิจฉัยชี้มูล", docs: ["รายงาน 644", "สำนวนและเอกสารประกอบ"], statusAfter: "รอผลมติคณะกรรมการ ป.ป.ท. (644)", slaDue: "30 วันก่อนประชุม", docType: "644" },
    J05:  { from: A7,  to: A4,  trigger: "คณะกรรมการ ป.ป.ท. มีมติรายงาน 644", docs: ["มติวินิจฉัยชี้มูล", "รายงาน/หนังสือแจ้งมติ"], statusAfter: "ได้รับผลมติ 644" },
    J06:  { parallel: true, from: A4,  to: A6,  trigger: "เจ้าของสำนวนยื่นคำขอคุ้มครองพยาน", docs: ["คำขอคุ้มครองพยาน", "ข้อมูลประเมินภัย"], statusAfter: "รอกิจกรรมคุ้มครองพยานรับคำขอ", slaDue: "7 วัน" },
    J07:  { parallel: true, from: A6,  to: A4,  trigger: "กิจกรรมคุ้มครองพยานแจ้งผลคำขอ", docs: ["ผลพิจารณาคำขอ", "คบ.5 / มาตรการที่กำหนด"], statusAfter: "ได้รับผลคุ้มครองพยาน", slaDue: "3 วัน" },
    J07B: { parallel: true, from: A6,  to: A7,  trigger: "มาตรการคุ้มครองพยานต้องขออนุมัติคณะกรรมการ", docs: ["ความเห็นกิจกรรมคุ้มครองพยาน", "คบ. ที่เกี่ยวข้อง"], statusAfter: "รอมติคณะกรรมการ (คุ้มครองพยาน)", slaDue: "15 วัน", docType: "GENERAL" },
    J07C: { parallel: true, from: A7,  to: A4,  trigger: "คณะกรรมการ ป.ป.ท. มีมติมาตรการคุ้มครองพยาน", docs: ["มติคณะกรรมการ"], statusAfter: "ได้รับมติคุ้มครองพยาน" },
    J08:  { parallel: true, from: A4,  to: A9,  trigger: "ขอหมายจับระหว่างไต่สวนชี้มูลคดีอาญา", docs: ["คำร้องขอหมายจับ (แบบ 11)", "หนังสืออัยการ/เหตุขอหมาย", "เอกสารประกอบ"], statusAfter: "รอกิจกรรมหมายจับรับชุดคำร้อง", slaDue: "3 วัน" },
    J09:  { parallel: true, from: A9,  to: A4,  trigger: "กิจกรรมหมายจับแจ้งผล", docs: ["เลขรับ/ผลศาล/ผลการจับ"], statusAfter: "ได้รับผลหมายจับ" },
    J10:  { from: A7,  to: A8,  trigger: "มติที่ต้องติดตามผลหรือติดตามวินัย", docs: ["มติคณะกรรมการ", "สำนวน", "หนังสือถึงต้นสังกัด"], statusAfter: "รอกิจกรรมติดตามคดีรับเรื่อง", slaDue: "30 วัน" },
    J10R: { parallel: true, from: A8,  to: A4,  trigger: "ผลการติดตามวินัย/ติดตามสำนวน", docs: ["ผลการดำเนินการของต้นสังกัด"], statusAfter: "ได้รับผลการติดตาม", slaDue: "7 วัน" },
    J11:  { from: A7,  to: A10, trigger: "มติที่ต้องดำเนินการทางกฎหมาย/ความเห็นอัยการ", docs: ["มติคณะกรรมการ", "ความเห็นอัยการ/เอกสารคดี"], statusAfter: "รอกิจกรรมกฎหมายในทางคดีรับเรื่อง", slaDue: "15 วัน" },
    J12:  { from: A10, to: A7,  trigger: "กิจกรรมกฎหมายเสนอเรื่องเข้าคณะกรรมการ", docs: ["บันทึกเสนอ", "ความเห็นกฎหมาย"], statusAfter: "รอมติคณะกรรมการ (เรื่องกฎหมาย)", docType: "GENERAL" },
    J12R: { from: A7,  to: A10, trigger: "คณะกรรมการ ป.ป.ท. มีมติเรื่องกฎหมาย", docs: ["มติคณะกรรมการ"], statusAfter: "ได้รับมติเรื่องกฎหมาย" },
    J13:  { from: A8,  to: A7,  trigger: "เสนอผลการติดตามวินัยต่อคณะกรรมการ", docs: ["รายงานผลการติดตาม", "ข้อเสนอ"], statusAfter: "รอมติคณะกรรมการ (ผลการติดตาม)", docType: "GENERAL" }
  };

  var PRELIM_STAGES = ["a5-intake", "a5-prelim", "a5-prelim-review", "a7-213"];
  var INQUIRY_STAGES = ["a5-inquiry", "a5-inquiry-review", "a7-644", "a5-outcome", "a5-prosecutor"];

  function text(v){ return String(v == null ? "" : v).trim(); }
  function ok(){ return { ok: true, reason: "" }; }
  function no(reason){ return { ok: false, reason: reason }; }

  function canSend(id, ctx){
    ctx = ctx || {};
    if (!CATALOG[id]) return no("ไม่รู้จักรอยต่อ " + id);
    if (id === "J06"){
      if (!text(ctx.caseNumber)) return no("ต้องมีเลขสำนวนก่อนส่งคำขอคุ้มครองพยาน");
      if (ctx.stage === "closed") return no("สำนวนปิดแล้ว");
      return ok();
    }
    if (id === "J08"){
      if (!text(ctx.caseNumber)) return no("ต้องมีเลขสำนวน");
      if (PRELIM_STAGES.indexOf(ctx.stage) !== -1) return no("ขอหมายจับจากช่วงไต่สวนเบื้องต้นไม่ได้");
      if (INQUIRY_STAGES.indexOf(ctx.stage) === -1 && ctx.track !== "644") return no("ขอหมายจับได้เฉพาะสายไต่สวนชี้มูล");
      if (ctx.criminal !== true) return no("ขอหมายจับได้เฉพาะคดีอาญา");
      if (!text(ctx.reason)) return no("ต้องระบุเหตุขอหมายจับ");
      return ok();
    }
    return ok();
  }

  var A7_213 = { ACCEPT_S24P1: "ACCEPT_24V1", ACCEPT_S24P3: "ACCEPT_24V3", MORE_INVESTIGATE: "ADDITIONAL_213",
                 NOT_ACCEPTED: "END_NO_EVIDENCE", DISMISS: "END_NO_EVIDENCE", NO_GROUND: "END_NO_EVIDENCE" };
  var FORWARD_213 = ["SEND_NACC", "SEND_POLICE", "SEND_DISCIPLINE_AGENCY"];
  function map213FromA7(code, extra){
    if (A7_213[code]) return A7_213[code];
    var chosen = text(extra && extra.a5Code);
    if (code === "FORWARD" && FORWARD_213.indexOf(chosen) !== -1) return chosen;
    return "OTHER";
  }

  var A5_644 = ["ADDITIONAL_644", "CRIMINAL_DISCIPLINARY", "SECTION_18_4", "DISCIPLINARY_ONLY",
                "NO_GROUNDS", "PROSECUTION_EXTINGUISHED", "SEND_NACC", "SEND_POLICE"];
  function map644FromA7(code, flags, extra){
    flags = flags || {};
    if (code === "GUILTY_72") return flags.criminal === false && flags.disciplinary ? "DISCIPLINARY_ONLY" : "CRIMINAL_DISCIPLINARY";
    if (code === "NO_MERIT_72") return "NO_GROUNDS";
    if (code === "MORE_INVESTIGATE_72") return "ADDITIONAL_644";
    if (code === "FORWARD_NACC") return "SEND_NACC";
    var chosen = text(extra && extra.a5Code);
    return A5_644.indexOf(chosen) !== -1 ? chosen : "";
  }

  function isAvailable(){
    return Boolean(global.ECMISHub && global.ECMISHub.getCase && global.ECMISHandoff && global.ECMISHandoff.send);
  }

  function send(id, args){
    var entry = CATALOG[id];
    if (!entry || !isAvailable()) return null;
    args = args || {};
    var payload = Object.assign({}, entry.docType ? { docType: entry.docType } : {}, args.payload || {});
    return global.ECMISHandoff.send({
      caseId: args.caseId, from: entry.from, to: entry.to, trigger: args.trigger || entry.trigger,
      docs: args.docs || entry.docs, statusAfter: args.statusAfter || entry.statusAfter,
      slaDue: args.slaDue || entry.slaDue || "", by: args.by, returnReason: args.returnReason,
      patch: args.patch, stay: true, keepStatus: entry.parallel === true, junctionId: id, payload: payload
    });
  }

  function takeInbound(id, caseId){
    var entry = CATALOG[id];
    if (!entry || !isAvailable() || !global.ECMISHandoff.inbound) return null;
    return global.ECMISHandoff.inbound(caseId, entry.to, id);
  }

  /* เคสทั้งหมดที่มีรอยต่อค้างมาถึงกิจกรรมนี้ (ใช้ตอนปลายทางเปิดหน้าคิว) */
  function pendingFor(activityKey){
    if (!isAvailable()) return [];
    var out = [];
    global.ECMISHub.getAllCases().forEach(function(c){
      global.ECMISHandoff.pendingEntries(c, activityKey).forEach(function(item){ out.push({ kase: c, entry: item.entry }); });
    });
    return out;
  }

  global.ECMISJunctions = {
    CATALOG: CATALOG, PRELIM_STAGES: PRELIM_STAGES, INQUIRY_STAGES: INQUIRY_STAGES,
    canSend: canSend, map213FromA7: map213FromA7, map644FromA7: map644FromA7,
    isAvailable: isAvailable, send: send, takeInbound: takeInbound, pendingFor: pendingFor
  };
})(typeof window !== "undefined" ? window : globalThis);
