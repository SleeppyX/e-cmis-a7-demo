/* ==========================================================================
   junction-bridge-a6.js — คุ้มครองพยาน (ก6) รับคำขอจากระบบไต่สวน (ก5) และแจ้งผลกลับ
   โหลดหลังสคริปต์หลักของ index.html (ใช้ intakeApplications, mainCaseOptions, ecmisSaveState, render
   ซึ่งประกาศเป็น const/function ระดับบนสุดของ <script> ธรรมดา จึงอ่านได้จากไฟล์นี้)

   รับเข้า: J06 คำขอคุ้มครองพยานพร้อมเลขสำนวนจริง → แฟ้มรับเรื่องที่เชื่อมคดีหลักแล้ว
   ส่งออก: J07 ผลคำขอกลับเจ้าของสำนวน (ก5), J07B เสนอคณะกรรมการ ป.ป.ท. (ก7) เมื่อต้องขออนุมัติ
   ========================================================================== */
(function(root){
  "use strict";

  var HERE = "witness-protection";
  var RESULTS = { APPROVED: "อนุมัติคุ้มครอง", URGENT_TEMPORARY_PROTECTION: "คุ้มครองชั่วคราว (เร่งด่วน)", REJECTED: "ไม่อนุมัติ",
    NEED_MORE_INFO: "ขอข้อมูลเพิ่มเติม", BOARD_REQUIRED: "ต้องเสนอคณะกรรมการ ป.ป.ท.", EXTERNAL_TRANSFER_REQUIRED: "ต้องส่งหน่วยงานภายนอก" };

  function text(v){ return String(v == null ? "" : v).trim(); }
  function esc(v){ return text(v).replace(/[&<>"']/g, function(c){ return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function J(){ return root.ECMISJunctions && root.ECMISJunctions.isAvailable() ? root.ECMISJunctions : null; }
  function nowTh(){ return new Date().toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" }); }
  function nextNo(){
    var year = new Date().getFullYear() + 543, max = 0;
    intakeApplications.concat(typeof demoCases !== "undefined" ? demoCases : []).forEach(function(item){
      var m = /^WP-\d{4}-(\d+)$/.exec(text(item.no)); if (m) max = Math.max(max, Number(m[1]));
    });
    return "WP-" + year + "-" + String(max + 1).padStart(6, "0");
  }

  function toMainCaseOption(caseNo, p){
    return { id: caseNo, number: "สำนวน " + caseNo, accused: text(p.accused) || "-", reference: caseNo, inquiry: "เลขสำนวน " + caseNo, redCase: "",
      type: text(p.subject) || "สำนวนไต่สวน", office: text(p.destinationUnit) || "ระบบไต่สวน (ก5)", status: "อยู่ระหว่างไต่สวน",
      score: 100, risk: p.risk && p.risk.urgency === "URGENT" ? "สูง" : "ปานกลาง", caseOwner: text(p.owner) || "เจ้าของสำนวน",
      caseOwnerPosition: "ผู้รับผิดชอบสำนวน", caseOwnerPhone: "", witnesses: [text(p.protectedPerson && p.protectedPerson.nameOrCode)].filter(Boolean) };
  }

  function toIntakeApplication(caseNo, p, envelopeAt){
    var person = p.protectedPerson || {}, risk = p.risk || {}, urgent = risk.urgency === "URGENT", at = nowTh();
    return { no: nextNo(), form: null, urgency: urgent ? "urgent" : "normal", person: text(person.nameOrCode), sender: text(p.owner) || "เจ้าของสำนวน (ก5)",
      status: "รอตรวจรับเอกสารต้นทาง", risk: urgent ? "สูง" : "ยังไม่ประเมิน", sourceType: "referred", source: "ระบบไต่สวน (ก5) ส่งคำขอผ่านระบบ",
      sourceChannel: "E-CMIS ก5 → ก6", receivedBy: "ระบบ E-CMIS", receivingUnit: "กลุ่มงานอำนวยการด้านคุ้มครองพยาน", receivedAt: at,
      scanStatus: "not_required", originalDocumentCount: 0, incidentSummary: text(risk.incidentSummary),
      mainCaseLinkStatus: "linked", mainCaseConfirmationState: "confirmed", mainCaseId: caseNo, mainCaseNo: "สำนวน " + caseNo,
      mainCaseReference: caseNo, mainCaseOffice: text(p.destinationUnit), mainCaseOwner: text(p.owner), mainCaseOwnerPosition: "ผู้รับผิดชอบสำนวน",
      mainCaseRelationship: "ส่งจากสำนวนไต่สวนโดยเจ้าของสำนวน", mainCaseLinkedAt: at, caseInvestigator: text(p.owner),
      mainCaseHistory: [{ at: at, action: "เชื่อมคดีหลักอัตโนมัติจากระบบไต่สวน", actor: "ระบบ E-CMIS", detail: "เลขสำนวน " + caseNo }],
      ecmisJunction: { from: "intake-investigation", caseId: caseNo, requestId: text(p.requestId), receivedAt: envelopeAt || new Date().toISOString(), resultSent: "" } };
  }

  function importPending(){
    var j = J();
    if (!j || typeof intakeApplications === "undefined") return 0;
    var count = 0;
    j.pendingFor(HERE).forEach(function(item){
      var entry = item.entry, p = entry.payload || {};
      if (entry.junctionId !== "J06") return;
      var caseNo = text(item.kase.id);
      var exists = intakeApplications.some(function(a){ return a.ecmisJunction && a.ecmisJunction.requestId === text(p.requestId); });
      if (!exists){
        intakeApplications.unshift(toIntakeApplication(caseNo, p, entry.since));
        if (typeof mainCaseOptions !== "undefined" && !mainCaseOptions.some(function(m){ return m.id === caseNo; })) mainCaseOptions.unshift(toMainCaseOption(caseNo, p));
        count++;
      }
      root.ECMISHandoff.receive(caseNo, HERE, "ผู้รับเรื่องคุ้มครองพยาน", "J06");
    });
    if (count && typeof ecmisSaveState === "function") ecmisSaveState();
    return count;
  }

  function linkedApplications(){
    return typeof intakeApplications === "undefined" ? [] : intakeApplications.filter(function(a){ return a.ecmisJunction; });
  }

  function sendResult(no){
    var app = linkedApplications().filter(function(a){ return a.no === no; })[0];
    if (!app || !root.Swal) return;
    var options = Object.keys(RESULTS).map(function(k){ return '<option value="' + k + '">' + RESULTS[k] + "</option>"; }).join("");
    root.Swal.fire({
      title: "แจ้งผลคำขอให้เจ้าของสำนวน", width: 640, confirmButtonText: "ส่งผล", showCancelButton: true, cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#1d5a91",
      html: '<div style="text-align:left;display:grid;gap:.6rem">'
        + "<div>แฟ้ม <b>" + esc(app.no) + "</b> · สำนวน <b>" + esc(app.ecmisJunction.caseId) + "</b> · " + esc(app.person) + "</div>"
        + '<label>ผลพิจารณา *<select id="jn6Result" class="swal2-select" style="width:100%;margin:0">' + options + "</select></label>"
        + '<label>เลขที่หนังสือ/คำสั่งอ้างอิง *<input id="jn6Ref" class="swal2-input" style="width:100%;margin:0"></label>'
        + '<label>มาตรการที่กำหนด<input id="jn6Measure" class="swal2-input" style="width:100%;margin:0" placeholder="เช่น จัดชุดคุ้มครอง / ปกปิดข้อมูล"></label>'
        + '<label>ระยะเวลาคุ้มครอง<input id="jn6Period" class="swal2-input" style="width:100%;margin:0" placeholder="เช่น 90 วัน"></label></div>',
      preConfirm: function(){
        var ref = text(document.getElementById("jn6Ref").value);
        if (!ref){ root.Swal.showValidationMessage("ต้องระบุเลขที่หนังสือ/คำสั่งอ้างอิง"); return false; }
        return { resultCode: document.getElementById("jn6Result").value, reference: ref,
          selectedMeasure: text(document.getElementById("jn6Measure").value), effectivePeriod: text(document.getElementById("jn6Period").value) };
      }
    }).then(function(r){
      if (!r.isConfirmed) return;
      var j = J(), caseId = app.ecmisJunction.caseId;
      var payload = Object.assign({ requestId: app.ecmisJunction.requestId, decisionDate: new Date().toISOString(), wpNo: app.no }, r.value);
      j.send("J07", { caseId: caseId, by: "กิจกรรมคุ้มครองพยาน", payload: payload });
      if (r.value.resultCode === "BOARD_REQUIRED"){
        // เสนอคณะกรรมการเป็นเรื่องทั่วไปของตัวเอง ไม่ใช้เลขสำนวน ก5 เพื่อไม่ชนกับรายงาน 213/644 ของสำนวนเดียวกัน
        j.send("J07B", { caseId: "WP:" + app.no, by: "กิจกรรมคุ้มครองพยาน", payload: Object.assign({ subject: "ขออนุมัติมาตรการคุ้มครองพยาน " + app.person + " (สำนวน " + caseId + ")",
          accused: "", owner: app.mainCaseOwner, destinationUnit: app.mainCaseOffice, sourceCaseId: caseId }, payload) });
      }
      app.ecmisJunction.resultSent = RESULTS[r.value.resultCode] + " · " + r.value.reference;
      app.status = r.value.resultCode === "BOARD_REQUIRED" ? "เสนอคณะกรรมการ ป.ป.ท. แล้ว" : "แจ้งผลเจ้าของสำนวนแล้ว";
      if (typeof ecmisSaveState === "function") ecmisSaveState();
      if (typeof render === "function") render();
      root.Swal.fire({ icon: "success", title: "ส่งผลแล้ว", text: r.value.resultCode === "BOARD_REQUIRED" ? "แจ้งเจ้าของสำนวนและเสนอคณะกรรมการ ป.ป.ท. แล้ว" : "เจ้าของสำนวนจะเห็นผลในระบบไต่สวน", confirmButtonColor: "#1d5a91" });
    });
  }

  function panel(){
    var apps = linkedApplications();
    if (!apps.length) return "";
    var rows = apps.map(function(a){
      var action = a.ecmisJunction.resultSent
        ? '<span class="scan-tag">ส่งผลแล้ว: ' + esc(a.ecmisJunction.resultSent) + "</span>"
        : '<button class="btn" data-jn6-result="' + esc(a.no) + '">แจ้งผลให้เจ้าของสำนวน</button>';
      return "<tr><td>" + esc(a.no) + "</td><td>" + esc(a.ecmisJunction.caseId) + "</td><td>" + esc(a.person) + "</td><td>"
        + esc(a.urgency === "urgent" ? "เร่งด่วน" : "ปกติ") + "</td><td>" + esc(a.status) + "</td><td>" + action + "</td></tr>";
    }).join("");
    return '<section class="card" data-jn6-panel><div class="card-head"><div><h2>คำขอจากระบบไต่สวน (ก5)</h2>'
      + "<p>คำขอที่เจ้าของสำนวนส่งผ่านระบบ เชื่อมเลขสำนวนจริงแล้ว เมื่อพิจารณาเสร็จให้แจ้งผลกลับเจ้าของสำนวน</p></div></div>"
      + '<div class="table-wrap"><table><thead><tr><th>เลขแฟ้ม</th><th>เลขสำนวน</th><th>ผู้ขอรับการคุ้มครอง</th><th>ความเร่งด่วน</th><th>สถานะ</th><th></th></tr></thead><tbody>'
      + rows + "</tbody></table></div></section>";
  }

  function decorate(){
    var route = (root.location.hash.replace(/^#\//, "") || "registry");
    if (route !== "registry" && route !== "intake") return;
    var view = document.getElementById("view");
    if (!view || view.querySelector("[data-jn6-panel]")) return;
    var html = panel();
    if (!html) return;
    view.insertAdjacentHTML("afterbegin", html);
    view.querySelectorAll("[data-jn6-result]").forEach(function(b){ b.addEventListener("click", function(){ sendResult(b.dataset.jn6Result); }); });
  }

  var count = 0;
  try { count = importPending(); } catch (e) { if (root.console) root.console.warn("[junction-a6] import", e); }
  if (typeof render === "function" && !render.__junctionWrapped){
    var original = render;
    render = function(){ var out = original.apply(this, arguments); try { decorate(); } catch (e) {} return out; };
    render.__junctionWrapped = true;
    render();
  }
  root.ECMISJunctionBridgeA6 = { importPending: importPending, toIntakeApplication: toIntakeApplication, sendResult: sendResult, lastImported: count };
})(typeof window !== "undefined" ? window : globalThis);
