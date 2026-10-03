/* ==========================================================================
   junction-bridge-a8.js — ติดตามคดี/วินัย (ก8) รับมติที่ต้องติดตามจาก ก7 และแจ้งผลกลับ
   โหลดหลังสคริปต์หลักของ person-screening/index.html (ใช้ BOARD_BATCHES, DISC_CASES, render002/003)

   ก8 ต้นแบบไม่เก็บ BOARD_BATCHES/DISC_CASES ลงเครื่อง ไฟล์นี้จึงเก็บงานที่รับจากทะเบียนกลาง
   ไว้เองใน STORE_KEY แล้วใส่กลับเข้าตารางทุกครั้งที่เปิดหน้า

   รับเข้า: J10 มติที่ต้องติดตาม (tracks: CHK002 ติดตามหลังมติ, CHK003 กำกับวินัย,
            BOARD_DECISION มติคณะกรรมการต่อข้อเสนอ J13 ของ ก8 เอง)
   ส่งออก: J10R ผลการติดตามกลับเจ้าของสำนวน (ก5), J13 เสนอผลติดตามต่อคณะกรรมการ ป.ป.ท. (ก7)
   ========================================================================== */
(function(root){
  "use strict";

  var HERE = "person-screening", STORE_KEY = "ecmis-a8-junction-cases-v1";
  var RESULTS = { Compliant: "ต้นสังกัดดำเนินการตามมติแล้ว", InProgress: "อยู่ระหว่างดำเนินการ",
    NonCompliant: "ดำเนินการไม่เป็นไปตามมติ", Section41NoAction: "ไม่แจ้งผล/ไม่ดำเนินการ (มาตรา 41)" };
  var TRACKS = { CHK002: "8.2 ติดตามหลังมติ", CHK003: "8.3 กำกับวินัย" };

  function text(v){ return String(v == null ? "" : v).trim(); }
  function esc(v){ return text(v).replace(/[&<>"']/g, function(c){ return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function J(){ return root.ECMISJunctions && root.ECMISJunctions.isAvailable() ? root.ECMISJunctions : null; }
  function read(){ try { var v = JSON.parse(root.localStorage.getItem(STORE_KEY) || "[]"); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
  function write(list){ try { root.localStorage.setItem(STORE_KEY, JSON.stringify(list)); } catch (e) {} }
  function today(){ return new Date().toISOString().slice(0, 10); }
  function find(list, caseId){ return list.filter(function(x){ return x.caseId === caseId; })[0] || null; }

  function importPending(){
    var j = J();
    if (!j) return 0;
    var list = read(), count = 0;
    j.pendingFor(HERE).forEach(function(item){
      var entry = item.entry, p = entry.payload || {}, caseId = text(item.kase.id);
      if (entry.junctionId !== "J10") return;
      var tracks = Array.isArray(p.tracks) ? p.tracks : [];
      if (tracks.indexOf("BOARD_DECISION") !== -1){
        // มติต่อข้อเสนอ J13 กลับมาในเลขเรื่องของข้อเสนอ (CHK:...) ต้องผูกกลับสำนวนต้นทาง
        var target = find(list, text(p.request && p.request.sourceCaseId));
        if (target){
          target.boardDecision = { a7Code: text(p.a7Code), text: text(p.text), reference: text(p.reference), decidedAt: text(p.decidedAt) };
          count++;
        }
      } else {
        var current = find(list, caseId);
        var fields = { caseId: caseId, tracks: tracks.filter(function(t){ return TRACKS[t]; }), accused: text(p.accused) || "-",
          agency: text(p.agency) || "-", subject: text(p.subject), a5Code: text(p.a5Code), a7Code: text(p.a7Code),
          resolutionReference: text(p.resolutionReference || p.reference), receivedAt: new Date().toISOString() };
        if (current) Object.assign(current, fields);
        else { list.unshift(Object.assign(fields, { results: [], proposal: null, boardDecision: null })); }
        count++;
      }
      root.ECMISHandoff.receive(caseId, HERE, "เจ้าหน้าที่ติดตามคดี กบค.", "J10");
    });
    if (count) write(list);
    return count;
  }

  function lastResult(item){ return item.results && item.results.length ? item.results[item.results.length - 1] : null; }

  function mount(){
    read().forEach(function(item){
      var last = lastResult(item);
      if (item.tracks.indexOf("CHK002") !== -1 && typeof BOARD_BATCHES !== "undefined"){
        var batchId = "A7-" + item.caseId;
        var batch = BOARD_BATCHES.filter(function(b){ return b.batchId === batchId; })[0];
        if (!batch){
          batch = { batchId: batchId, refNo: item.resolutionReference || "มติ ก7", meeting: item.receivedAt.slice(0, 10), circularNo: "รอออกหนังสือเวียน",
            statusCode: "01", statusName: "รับเรื่องจาก ก7 แล้ว รอทำบันทึกแจ้งเวียน", sla: "30 วัน",
            cases: [{ caseId: item.caseId, accused: item.accused, agency: item.agency, category: item.a5Code || item.a7Code || "-", size: "—" }] };
          BOARD_BATCHES.unshift(batch);
        }
        if (last){ batch.statusCode = last.result === "Compliant" ? "12" : "04"; batch.statusName = "แจ้งผลเจ้าของสำนวนแล้ว: " + RESULTS[last.result]; }
      }
      if (item.tracks.indexOf("CHK003") !== -1 && typeof DISC_CASES !== "undefined"){
        var row = DISC_CASES.filter(function(r){ return r.caseId === item.caseId; })[0];
        if (!row){
          row = { caseId: item.caseId, accused: item.accused, position: "-", agency: item.agency };
          DISC_CASES.unshift(row);
        }
        Object.assign(row, { sanction: last ? (last.sanction || "-") : "รอต้นสังกัดแจ้งผล", result: last ? last.result : "InProgress",
          details: last ? last.details : "รับมติจากคณะกรรมการ ป.ป.ท. " + item.resolutionReference + " รอหนังสือแจ้งผลจากต้นสังกัด" });
      }
    });
  }

  function refresh(){
    mount();
    if (typeof render002 === "function") render002();
    if (typeof render003 === "function") render003();
    decorate();
  }

  function sendResult(caseId){
    var list = read(), item = find(list, caseId);
    if (!item || !root.Swal) return;
    var options = Object.keys(RESULTS).map(function(k){ return '<option value="' + k + '">' + RESULTS[k] + "</option>"; }).join("");
    root.Swal.fire({ title: "แจ้งผลการติดตามกลับเจ้าของสำนวน", confirmButtonText: "บันทึกและแจ้งระบบไต่สวน", cancelButtonText: "ยกเลิก",
      showCancelButton: true, confirmButtonColor: "#0d1b3e",
      html: '<label style="display:block;text-align:left">ผล *<select id="jn8Result" class="swal2-select" style="width:100%;margin:0">' + options + "</select></label>"
        + '<label style="display:block;text-align:left;margin-top:.5rem">โทษ/มาตรการของต้นสังกัด<input id="jn8Sanction" class="swal2-input" style="width:100%;margin:0"></label>'
        + '<label style="display:block;text-align:left;margin-top:.5rem">รายละเอียด/หนังสือตอบ *<input id="jn8Details" class="swal2-input" style="width:100%;margin:0"></label>'
        + '<label style="display:block;text-align:left;margin-top:.5rem">วันที่ *<input id="jn8Date" type="date" class="swal2-input" style="width:100%;margin:0" value="' + today() + '"></label>',
      preConfirm: function(){
        var v = { result: document.getElementById("jn8Result").value, sanction: text(document.getElementById("jn8Sanction").value),
          details: text(document.getElementById("jn8Details").value), resultDate: document.getElementById("jn8Date").value };
        if (!v.details || !v.resultDate){ root.Swal.showValidationMessage("กรอกรายละเอียดและวันที่"); return false; }
        return v;
      }
    }).then(function(r){
      if (!r.isConfirmed) return;
      var v = Object.assign({ resultLabel: RESULTS[r.value.result], at: new Date().toISOString() }, r.value);
      J().send("J10R", { caseId: item.caseId, by: "กิจกรรมติดตามคดี (ก8)", payload: Object.assign({ tracks: item.tracks,
        boardDecision: item.boardDecision }, v) });
      item.results.push(v);
      write(list);
      refresh();
      root.Swal.fire({ icon: "success", title: "แจ้งผลแล้ว", text: "เจ้าของสำนวนจะเห็นผลในระบบไต่สวน", confirmButtonColor: "#1d5a91" });
    });
  }

  function propose(caseId){
    var list = read(), item = find(list, caseId), last = item && lastResult(item);
    if (!item || !last || !root.Swal) return;
    root.Swal.fire({ title: "เสนอคณะกรรมการ ป.ป.ท.", input: "textarea", inputLabel: "ข้อเสนอ", confirmButtonText: "ส่งเสนอ",
      cancelButtonText: "ยกเลิก", showCancelButton: true, confirmButtonColor: "#0d1b3e",
      inputValue: "ต้นสังกัด" + RESULTS[last.result] + " เสนอพิจารณาดำเนินการตามมาตรา 41",
      inputValidator: function(v){ return text(v) ? null : "กรอกข้อเสนอ"; }
    }).then(function(r){
      if (!r.isConfirmed) return;
      // เสนอเป็นเรื่องของ ก8 เอง ไม่ใช้เลขสำนวนเดิม เพื่อไม่ทับประวัติมติ 644 ของสำนวนใน ก7
      J().send("J13", { caseId: "CHK:" + item.caseId, by: "กิจกรรมติดตามคดี (ก8)", payload: { docType: "GENERAL",
        subject: "ผลติดตามวินัย " + item.accused + " (สำนวน " + item.caseId + ")", accused: item.accused, agency: item.agency,
        sourceCaseId: item.caseId, report: last, proposal: text(r.value) } });
      item.proposal = { sentAt: new Date().toISOString(), text: text(r.value) };
      item.boardDecision = null;
      write(list);
      refresh();
      root.Swal.fire({ icon: "success", title: "ส่งเสนอแล้ว", text: "เรื่องเข้าคิวคณะกรรมการ ป.ป.ท. (ก7)", confirmButtonColor: "#1d5a91" });
    });
  }

  function panel(){
    var list = read();
    if (!list.length) return "";
    var rows = list.map(function(item){
      var last = lastResult(item), id = esc(item.caseId);
      var progress = [last ? "ผลล่าสุด: " + RESULTS[last.result] : "ยังไม่แจ้งผล",
        item.proposal && !item.boardDecision ? "เสนอคณะกรรมการแล้ว รอมติ" : "",
        item.boardDecision ? "มติคณะกรรมการ: " + (item.boardDecision.text || item.boardDecision.a7Code) : ""].filter(Boolean).map(esc).join(" · ");
      var actions = '<button class="btn" data-jn8-act="result" data-jn8-id="' + id + '">แจ้งผลกลับระบบไต่สวน</button>';
      if (last && last.result !== "Compliant" && !(item.proposal && !item.boardDecision)){
        actions += ' <button class="btn" data-jn8-act="propose" data-jn8-id="' + id + '">เสนอคณะกรรมการ ป.ป.ท.</button>';
      }
      return "<tr><td>" + id + "</td><td>" + esc(item.accused) + "<br><small>" + esc(item.agency) + "</small></td><td>"
        + item.tracks.map(function(t){ return esc(TRACKS[t]); }).join("<br>") + "</td><td>" + esc(item.resolutionReference) + "</td><td>"
        + progress + "</td><td>" + actions + "</td></tr>";
    }).join("");
    return '<section data-jn8-panel class="detail-card" style="display:block;margin-bottom:16px"><strong>งานติดตามจากมติคณะกรรมการ ป.ป.ท. (ก7)</strong>'
      + '<div style="color:#62738a;font-size:12px;margin-top:4px">รับผ่านทะเบียนกลาง · แจ้งผลต้นสังกัดกลับเจ้าของสำนวน และเสนอคณะกรรมการเมื่อไม่เป็นไปตามมติ</div>'
      + '<div class="table-wrap" style="margin-top:10px"><table><thead><tr><th>เลขสำนวน</th><th>ผู้ถูกกล่าวหา</th><th>งานติดตาม</th><th>มติอ้างอิง</th><th>ความคืบหน้า</th><th></th></tr></thead><tbody>'
      + rows + "</tbody></table></div></section>";
  }

  function decorate(){
    var anchor = document.getElementById("view-chk001");
    if (!anchor) return;
    var old = document.querySelector("[data-jn8-panel]");
    if (old) old.remove();
    var html = panel();
    if (!html) return;
    anchor.insertAdjacentHTML("beforebegin", html);
    document.querySelectorAll("[data-jn8-act]").forEach(function(b){
      b.addEventListener("click", function(){ (b.dataset.jn8Act === "propose" ? propose : sendResult)(b.dataset.jn8Id); });
    });
  }

  var count = 0;
  try { count = importPending(); refresh(); } catch (e) { if (root.console) root.console.warn("[junction-a8] import", e); }
  root.ECMISJunctionBridgeA8 = { importPending: importPending, refresh: refresh, lastImported: count, sendResult: sendResult, propose: propose };
})(typeof window !== "undefined" ? window : globalThis);
