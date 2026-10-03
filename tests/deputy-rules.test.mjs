/* กฎธุรกิจฝั่งรองเลขาธิการคณะกรรมการ ป.ป.ท. — ขั้นแรกของกิจกรรมที่ 7 ทุกสาย (7.1 / 7.2 / 7.3)
   อ้างอิง: Plan_A7_Deputy_Role (ตกลงกับผู้ใช้ 2026-10-02, Task 183) — ทำจริงใน Task 190
   รันด้วย: node board-resolution/tests/deputy-rules.test.mjs                          */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(resolve(here, "../assets/ecmis-app.js"), "utf8");
const window = { addEventListener() {} };
vm.runInNewContext(source, { window });
const ECMIS = window.ECMIS;

const can = (from, to, kase) => ECMIS.canTransition(from, to, kase).ok;
const withOpinion = { deputyOpinion: "ตรวจสอบสำนวนแล้วเห็นชอบตามที่เสนอ", actorRoleId: "deputy" };

/* ---------------------------------------------------------------------
   ตัวตน — รองเลขาฯ เป็น role แยก ไม่ผูกชื่อเลขาธิการฯ อีกแล้ว
   --------------------------------------------------------------------- */
const deputy = ECMIS.getRole("deputy");
assert.equal(deputy.id, "deputy");
assert.equal(deputy.name, "นายประเสริฐ ธรรมพิทักษ์");
assert.notEqual(deputy.name, ECMIS.getRole("secgen").name, "รองเลขาฯ ต้องไม่ใช่บุคคลเดียวกับเลขาธิการฯ");
assert.equal(ECMIS.isUpstreamRole("deputy"), false, "รองเลขาฯ เป็นขั้นของ กจ.7 ไม่ใช่ต้นทาง กจ.5");
assert.equal(ECMIS.homeHref("deputy"), "inbox.html");

/* ---------------------------------------------------------------------
   สถานะ 004 / 102 เป็นขั้นแรกของ กจ.7 (ไม่ใช่ UPSTREAM)
   --------------------------------------------------------------------- */
assert.equal(ECMIS.STATUS.PENDING_DEPUTY.owner, "deputy");
assert.equal(ECMIS.STATUS.PENDING_DEPUTY_72.owner, "deputy");
assert.equal(ECMIS.isUpstreamCase({ status: "PENDING_DEPUTY" }), false);
assert.equal(ECMIS.STATUS_CODE.PENDING_DEPUTY, "004", "ใช้รหัสเดิม ไม่เพิ่มรหัส DB");
assert.equal(ECMIS.STATUS_CODE.PENDING_DEPUTY_72, "102", "ใช้รหัสเดิม ไม่เพิ่มรหัส DB");

/* ---------------------------------------------------------------------
   เส้นทาง: เสนอเลขาฯ (ต้องมีความเห็น) / ตีกลับต้นทาง — 7.1 และ 7.3 ใช้สถานะชุดเดียวกัน
   --------------------------------------------------------------------- */
assert.equal(can("PENDING_DEPUTY", "PENDING_SECGEN", withOpinion), true, "004 → 005 เมื่อมีความเห็น");
assert.equal(can("PENDING_DEPUTY", "PENDING_SECGEN", { actorRoleId: "deputy" }), false, "ความเห็นเป็นช่องบังคับ");
assert.equal(can("PENDING_DEPUTY", "PENDING_SECGEN", { deputyOpinion: "   ", actorRoleId: "deputy" }), false, "ช่องว่างล้วนไม่นับเป็นความเห็น");
assert.equal(can("PENDING_DEPUTY", "RETURNED", { actorRoleId: "deputy" }), true, "004 → 001 ตีกลับต้นทาง");
assert.equal(can("PENDING_DEPUTY_72", "PENDING_SECGEN_72", withOpinion), true, "102 → 104 เมื่อมีความเห็น");
assert.equal(can("PENDING_DEPUTY_72", "PENDING_SECGEN_72", { actorRoleId: "deputy" }), false, "7.2 ความเห็นก็บังคับ");
assert.equal(can("PENDING_DEPUTY_72", "RETURNED_72", { actorRoleId: "deputy" }), true, "102 → 103 ตีกลับต้นทาง");

/* รองเลขาฯ ไม่มีอำนาจชี้ซับซ้อน / เร่งด่วน และ role อื่นทำแทนรองเลขาฯ ไม่ได้ */
assert.equal(can("PENDING_DEPUTY", "PENDING_SECGEN", { ...withOpinion, actorRoleId: "secgen" }), false, "เลขาธิการฯ ทำแทนรองเลขาฯ ไม่ได้");
assert.equal(can("PENDING_DEPUTY", "PENDING_SUPPORT_ASSIGN", withOpinion), false, "ไม่มีทางลัดชี้ซับซ้อนจากขั้นรองเลขาฯ");
assert.equal(can("PENDING_DEPUTY", "PENDING_URGENT", withOpinion), false, "ไม่มีทางลัดเร่งด่วนจากขั้นรองเลขาฯ");
assert.equal(ECMIS.canRecall({ status: "PENDING_DEPUTY" }, "owner"), false, "เจ้าของสำนวนเรียกคืนจากขั้น กจ.7 ไม่ได้");

/* ---------------------------------------------------------------------
   แถบขั้นตอน: ทุกสายเริ่มที่ "รองเลขาธิการฯ พิจารณา"
   --------------------------------------------------------------------- */
for (const [label, kase] of [
  ["7.1", { status: "PENDING_DEPUTY", procType: "7.1" }],
  ["7.2", { status: "PENDING_DEPUTY_72", procType: "7.2" }],
  ["7.3", { status: "PENDING_DEPUTY", procType: "7.3" }]
]) {
  const steps = ECMIS.caseFlowSteps(kase);
  assert.equal(steps[0].role, "รองเลขาธิการฯ", `${label}: ขั้นแรกต้องเป็นรองเลขาฯ`);
  assert.equal(steps[1].role, "เลขาธิการฯ", `${label}: ขั้นถัดไปเป็นเลขาธิการฯ`);
}

/* ---------------------------------------------------------------------
   การ์ดที่มาของสำนวน: ความเห็นรองเลขาฯ เป็นข้อมูลจริง ชั้นก่อนหน้าเป็นตัวอย่างประกอบ
   --------------------------------------------------------------------- */
const chain = ECMIS.buildChainOpinions({
  status: "PENDING_SECGEN", receivedDate: "2569-09-01",
  deputyOpinion: "เห็นชอบ เสนอเลขาธิการฯ", deputySignedAt: "2569-09-05", deputyName: deputy.name
});
const dep = chain.find(o => o.roleId === "deputy");
assert.equal(dep.mock, false, "แถวรองเลขาฯ ต้องไม่ใช่ตัวอย่าง");
assert.equal(dep.note, "เห็นชอบ เสนอเลขาธิการฯ");
assert.equal(dep.date, "2569-09-05");
assert.ok(chain.filter(o => o.roleId !== "deputy").every(o => o.mock), "ชั้นกอง/เขตยังเป็นตัวอย่างประกอบ");
const noOpinion = ECMIS.buildChainOpinions({ status: "PENDING_SECGEN", receivedDate: "2569-09-01" });
assert.equal(noOpinion.find(o => o.roleId === "deputy").mock, true, "ยังไม่มีความเห็นจริง = ตัวอย่าง");

console.log("deputy-rules: ผ่านทุกข้อ");
