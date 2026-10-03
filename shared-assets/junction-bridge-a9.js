/* ==========================================================================
   junction-bridge-a9.js — หมายจับ (ก9) รับคำร้องขอหมายจับจากระบบไต่สวน (ก5) และแจ้งผลกลับ
   โหลดหลังสคริปต์หลักของ arrest-warrant/index.html (ใช้ demoCases, createWorkflowCase, render)

   ก9 ต้นแบบไม่เก็บข้อมูลลงเครื่อง ไฟล์นี้จึงเก็บคำร้องที่รับจาก ก5 ไว้เองใน STORE_KEY
   แล้วใส่กลับเข้า demoCases ทุกครั้งที่เปิดหน้า

   รับเข้า: J08 ชุดคำร้องขอหมายจับ (ส่งได้เฉพาะสายไต่สวนชี้มูลคดีอาญา — ประตูอยู่ฝั่ง ก5)
   ส่งออก: J09 ยืนยันรับชุดคำร้อง / ผลศาล / ผลการจับ กลับเจ้าของสำนวน
   ========================================================================== */
(function(root){
  "use strict";

  var HERE = "arrest-warrant", STORE_KEY = "ecmis-a9-junction-cases-v1";
  var COURT = { ISSUED: "ศาลออกหมายจับ", DENIED: "ศาลไม่ออกหมายจับ" };
  var ARREST = { ARRESTED: "จับได้/มอบตัว", NOT_FOUND: "ยังไม่พบตัว", WITHDRAWN: "ศาลถอนหมาย", EXPIRED: "หมายสิ้นผล (ขาดอายุความ)" };

  function text(v){ return String(v == null ? "" : v).trim(); }
  function esc(v){ return text(v).replace(/[&<>"']/g, function(c){ return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function J(){ return root.ECMISJunctions && root.ECMISJunctions.isAvailable() ? root.ECMISJunctions : null; }
  function read(){ try { var v = JSON.parse(root.localStorage.getItem(STORE_KEY) || "[]"); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
  function write(list){ try { root.localStorage.setItem(STORE_KEY, JSON.stringify(list)); } catch (e) {} }
  function today(){ return new Date().toISOString().slice(0, 10); }

  function nextAwNo(existing){
    var year = new Date().getFullYear() + 543, max = 0;
    existing.forEach(function(item){ var m = /^AW-\d{4}-(\d+)$/.exec(text(item.activity9No)); if (m) max = Math.max(max, Number(m[1])); });
    return "AW-" + year + "-" + String(max + 1).padStart(6, "0");
  }

  function toSeed(caseId, p, existing){
    return {
      no: "A5-" + caseId, activity9No: nextAwNo(existing), sourceTransferId: "ก5-ส่งต่อ-" + caseId,
      suspect: text(p.personName), status: "งานใหม่จากกิจกรรมที่ 5", stage: "activity5_new", owner: "ยังไม่ได้มอบหมาย",
      caseOwner: text(p.owner) || "เจ้าของสำนวน", next: "ตรวจข้อมูลสำนวนและเอกสารต้นทางก่อนเปิดงานจัดทำคำร้อง",
      fromCaseNo: caseId, caseType: "คดีอาญา (ไต่สวนชี้มูล)", caseTitle: text(p.subject), charge: text(p.charge),
      idCard: "", address: "", department: text(p.destinationUnit), factSummary: text(p.factSummary), warrantReason: text(p.warrantReason),
      evidence: "ชุดคำร้องขอหมายจับ (แบบ 11) และเอกสารแนบจากระบบไต่สวน", attachments: [],
      sentToProsecutorDate: "", prosecutorOrder: { date: text(p.prosecutorLetterDate), ref: text(p.prosecutorLetterNo), name: "", agency: "พนักงานอัยการ",
        summary: text(p.warrantReason), file: "" },
      activity5Source: { sentAt: text(p.sentAt), sentBy: text(p.owner), sourceModule: "กิจกรรมที่ 5 ระบบไต่สวนข้อเท็จจริง", assignedTo: "" },
      ecmisJunction: { caseId: caseId, warrantId: text(p.warrantId), roundId: text(p.roundId), personId: text(p.personId),
        receiptNo: "", court: "", arrest: "", courtRef: "" }
    };
  }

  function importPending(){
    var j = J();
    if (!j) return 0;
    var list = read(), count = 0;
    j.pendingFor(HERE).forEach(function(item){
      var entry = item.entry, p = entry.payload || {};
      if (entry.junctionId !== "J08") return;
      if (!list.some(function(s){ return s.ecmisJunction.warrantId === text(p.warrantId); })){
        list.unshift(toSeed(text(item.kase.id), p, list.concat(typeof demoCases !== "undefined" ? demoCases : [])));
        count++;
      }
      root.ECMISHandoff.receive(item.kase.id, HERE, "ธุรการคดี กอท.", "J08");
    });
    if (count) write(list);
    return count;
  }

  function mount(){
    if (typeof demoCases === "undefined" || typeof createWorkflowCase !== "function") return;
    read().forEach(function(seed){
      if (!demoCases.some(function(c){ return c.no === seed.no && c.ecmisJunction && c.ecmisJunction.warrantId === seed.ecmisJunction.warrantId; })){
        demoCases.unshift(createWorkflowCase(JSON.parse(JSON.stringify(seed))));
      }
    });
  }

  function update(warrantId, patch){
    var list = read();
    list.forEach(function(s){ if (s.ecmisJunction.warrantId === warrantId) Object.assign(s.ecmisJunction, patch); });
    write(list);
    return list.filter(function(s){ return s.ecmisJunction.warrantId === warrantId; })[0];
  }

  function sendResult(seed, kind, fields){
    var j = J();
    j.send("J09", { caseId: seed.ecmisJunction.caseId, by: "กิจกรรมหมายจับ", payload: Object.assign({
      kind: kind, warrantId: seed.ecmisJunction.warrantId, roundId: seed.ecmisJunction.roundId, personId: seed.ecmisJunction.personId,
      activity9No: seed.activity9No, personName: seed.suspect }, fields) });
  }

  function act(warrantId, kind){
    var seed = read().filter(function(s){ return s.ecmisJunction.warrantId === warrantId; })[0];
    if (!seed || !root.Swal) return;
    var html, collect;
    if (kind === "receipt"){
      html = '<label style="display:block;text-align:left">เลขรับ *<input id="jn9No" class="swal2-input" style="width:100%;margin:0" value="' + esc(seed.activity9No) + '"></label>'
        + '<label style="display:block;text-align:left;margin-top:.5rem">วันที่รับ *<input id="jn9Date" type="date" class="swal2-input" style="width:100%;margin:0" value="' + today() + '"></label>'
        + '<label style="display:block;text-align:left;margin-top:.5rem">ผู้รับ *<input id="jn9By" class="swal2-input" style="width:100%;margin:0" value="ธุรการคดี กอท."></label>';
      collect = function(){ return { receiptNo: text(document.getElementById("jn9No").value), receivedAt: document.getElementById("jn9Date").value, receiverName: text(document.getElementById("jn9By").value) }; };
    } else {
      var options = kind === "court" ? COURT : ARREST;
      html = '<label style="display:block;text-align:left">ผล *<select id="jn9Result" class="swal2-select" style="width:100%;margin:0">'
        + Object.keys(options).map(function(k){ return '<option value="' + k + '">' + options[k] + "</option>"; }).join("") + "</select></label>"
        + '<label style="display:block;text-align:left;margin-top:.5rem">' + (kind === "court" ? "เลขหมายจับ/คำสั่งศาล" : "รายละเอียด/เอกสารอ้างอิง") + ' *<input id="jn9Ref" class="swal2-input" style="width:100%;margin:0"></label>'
        + '<label style="display:block;text-align:left;margin-top:.5rem">วันที่ *<input id="jn9Date" type="date" class="swal2-input" style="width:100%;margin:0" value="' + today() + '"></label>';
      collect = function(){ return { result: document.getElementById("jn9Result").value, resultLabel: options[document.getElementById("jn9Result").value],
        reference: text(document.getElementById("jn9Ref").value), resultDate: document.getElementById("jn9Date").value }; };
    }
    var title = { receipt: "ยืนยันรับชุดคำร้องจากระบบไต่สวน", court: "บันทึกผลศาล", arrest: "บันทึกผลการจับ" }[kind];
    root.Swal.fire({ title: title, html: html, showCancelButton: true, confirmButtonText: "บันทึกและแจ้งเจ้าของสำนวน", cancelButtonText: "ยกเลิก", confirmButtonColor: "#0d1b3e",
      preConfirm: function(){
        var v = collect();
        if (Object.keys(v).some(function(k){ return !text(v[k]); })){ root.Swal.showValidationMessage("กรอกข้อมูลให้ครบ"); return false; }
        return v;
      }
    }).then(function(r){
      if (!r.isConfirmed) return;
      sendResult(seed, kind, r.value);
      var patch = kind === "receipt" ? { receiptNo: r.value.receiptNo } : kind === "court" ? { court: r.value.resultLabel, courtRef: r.value.reference } : { arrest: r.value.resultLabel };
      update(warrantId, patch);
      if (typeof render === "function") render();
    });
  }

  function panel(){
    var list = read();
    if (!list.length) return "";
    var rows = list.map(function(s){
      var jn = s.ecmisJunction, id = esc(jn.warrantId), actions;
      if (!jn.receiptNo) actions = '<button class="btn" data-jn9-act="receipt" data-jn9-id="' + id + '">ยืนยันรับชุดคำร้อง</button>';
      else if (!jn.court) actions = '<button class="btn" data-jn9-act="court" data-jn9-id="' + id + '">บันทึกผลศาล</button>';
      else if (/ออกหมาย/.test(jn.court) && !/ไม่ออก/.test(jn.court) && !jn.arrest) actions = '<button class="btn" data-jn9-act="arrest" data-jn9-id="' + id + '">บันทึกผลการจับ</button>';
      else actions = "<span>แจ้งผลครบแล้ว</span>";
      var progress = [jn.receiptNo ? "รับแล้ว " + jn.receiptNo : "ยังไม่ยืนยันรับ", jn.court ? jn.court + (jn.courtRef ? " (" + jn.courtRef + ")" : "") : "", jn.arrest].filter(Boolean).map(esc).join(" · ");
      return "<tr><td>" + esc(s.activity9No) + "</td><td>" + esc(jn.caseId) + "</td><td>" + esc(s.suspect) + "</td><td>" + progress + "</td><td>" + actions + "</td></tr>";
    }).join("");
    return '<section class="card" data-jn9-panel style="margin-bottom:16px"><div class="card-head"><div><h2>คำร้องขอหมายจับจากระบบไต่สวน (ก5)</h2>'
      + "<p>รับชุดคำร้องและแจ้งผลศาล/ผลการจับกลับเจ้าของสำนวนผ่านระบบ</p></div></div>"
      + '<div class="table-wrap"><table><thead><tr><th>เลขงาน ก9</th><th>เลขสำนวน</th><th>ผู้ถูกกล่าวหา</th><th>ความคืบหน้า</th><th></th></tr></thead><tbody>'
      + rows + "</tbody></table></div></section>";
  }

  function decorate(){
    var route = (root.location.hash.replace(/^#\//, "") || "registry");
    if (route !== "registry") return;
    var view = document.getElementById("view");
    if (!view || view.querySelector("[data-jn9-panel]")) return;
    var html = panel();
    if (!html) return;
    view.insertAdjacentHTML("afterbegin", html);
    view.querySelectorAll("[data-jn9-act]").forEach(function(b){ b.addEventListener("click", function(){ act(b.dataset.jn9Id, b.dataset.jn9Act); }); });
  }

  var count = 0;
  try { count = importPending(); mount(); } catch (e) { if (root.console) root.console.warn("[junction-a9] import", e); }
  if (typeof render === "function" && !render.__junctionWrapped){
    var original = render;
    render = function(){ var out = original.apply(this, arguments); try { decorate(); } catch (e) {} return out; };
    render.__junctionWrapped = true;
    render();
  }
  root.ECMISJunctionBridgeA9 = { importPending: importPending, toSeed: toSeed, lastImported: count, act: act };
})(typeof window !== "undefined" ? window : globalThis);
