/**
 * 🎨 DrawDB ERD JSON Generator for Activity 7
 * 
 * Generates the complete Database Diagram JSON in the exact DrawDB format
 * matching "C:\Users\Toon\OneDrive\Documents\8.1_V1.1 (1).json".
 */

const fs = require('fs');
const path = require('path');

let tableCounter = 1770000000000;
let colCounter = 1770000000000;
let relCounter = 1770000000100;

function genTableId() { tableCounter += 10; return 't_' + tableCounter; }
function genColId(isPk) { colCounter += 1; return (isPk ? 'c_' : 'col_') + colCounter; }
function genRelId() { relCounter += 1; return 'r_' + relCounter; }

const tableMap = {}; // name -> { id, colMap: { colName -> id } }

function buildTable(def) {
  const tid = genTableId();
  const colMap = {};
  const columns = def.columns.map(c => {
    const cid = genColId(!!c.pk);
    colMap[c.name] = cid;
    return {
      id: cid,
      name: c.name,
      type: c.type,
      pk: !!c.pk,
      ai: !!c.ai,
      nn: !!c.nn,
      uq: !!c.uq,
      ix: !!c.ix,
      default: c.default || "",
      description: c.description || ""
    };
  });

  tableMap[def.name] = { id: tid, colMap };

  return {
    id: tid,
    name: def.name,
    color: def.color,
    x: def.x,
    y: def.y,
    description: def.description,
    columns
  };
}

const rawTables = [
  // 1. tbl_cmp_case
  {
    name: 'tbl_cmp_case',
    color: '#f59e0b',
    x: 400,
    y: 40,
    description: 'ตารางสำนวนคดีหลักที่ส่งเข้ามาพิจารณาในระบบ E-CMIS กิจกรรมที่ 7',
    columns: [
      { name: 'tcc_id', type: 'BIGSERIAL', pk: true, ai: true, nn: true, description: 'รหัสลำดับสำนวนคดี (Primary Key)' },
      { name: 'tcc_no', type: 'VARCHAR(50)', nn: true, uq: true, description: 'เลขที่สำนวนคดี (เช่น 1396/2564)' },
      { name: 'tcc_subject', type: 'TEXT', nn: true, description: 'ชื่อเรื่อง / พฤติการณ์การกระทำความผิด' },
      { name: 'tcc_allegation', type: 'TEXT', description: 'ข้อกล่าวหาโดยสรุป' },
      { name: 'tcc_legal_base', type: 'VARCHAR(100)', description: 'ฐานความผิดกฎหมายตั้งต้น (เช่น ม.18/4, ม.62)' },
      { name: 'tcc_complainant', type: 'VARCHAR(255)', description: 'ผู้กล่าวหา / หน่วยงานผู้ส่งเรื่อง' },
      { name: 'tcc_owner', type: 'VARCHAR(255)', description: 'พนักงานเจ้าของสำนวน' },
      { name: 'tcc_owner_org', type: 'VARCHAR(255)', description: 'หน่วยงานเจ้าของสำนวน (สำนัก/กอง/เขต)' },
      { name: 'tcc_received_date', type: 'DATE', description: 'วันที่รับสำนวนเข้าระบบ' },
      { name: 'tcc_prescription_date', type: 'DATE', description: 'วันที่ขาดอายุความของคดี' },
      { name: 'tcc_doc_ref', type: 'VARCHAR(100)', description: 'เลขที่หนังสืออ้างอิงต้นเรื่อง' },
      { name: 'tcc_doc_type', type: 'VARCHAR(20)', default: "'213'", description: 'ประเภทรายงาน (213, 644, RULING, GENERAL)' },
      { name: 'tcc_urgent', type: 'BOOLEAN', default: 'false', description: 'เครื่องหมายคดีเร่งด่วน (มีใบด่วน)' },
      { name: 'tcc_complex', type: 'BOOLEAN', default: 'false', description: 'เครื่องหมายคดียุ่งยากซับซ้อน' },
      { name: 'is_deleted', type: 'BOOLEAN', default: 'false', description: 'Soft Delete Flag (true=ลบ, false=ใช้งาน)' },
      { name: 'created_datetime', type: 'TIMESTAMP', default: 'now()', description: 'วันเวลาที่สร้างข้อมูล' },
      { name: 'created_by', type: 'INTEGER', description: 'ผู้สร้างข้อมูล' },
      { name: 'updated_datetime', type: 'TIMESTAMP', description: 'วันเวลาที่แก้ไขข้อมูลล่าสุด' },
      { name: 'updated_by', type: 'INTEGER', description: 'ผู้แก้ไขข้อมูล' }
    ]
  },

  // 2. tbl_cmp_case_accused
  {
    name: 'tbl_cmp_case_accused',
    color: '#a78bfa',
    x: 400,
    y: 720,
    description: 'ตารางรายชื่อผู้ถูกกล่าวหาในแต่ละสำนวนคดี',
    columns: [
      { name: 'tcca_id', type: 'BIGSERIAL', pk: true, ai: true, nn: true, description: 'รหัสลำดับผู้ถูกกล่าวหา (Primary Key)' },
      { name: 'tcc_id', type: 'BIGINT', nn: true, description: 'รหัสสำนวนคดี อ้างอิง tbl_cmp_case(tcc_id)' },
      { name: 'tcca_no', type: 'INTEGER', nn: true, description: 'ลำดับที่ของผู้ถูกกล่าวหาในสำนวน (1, 2, ...)' },
      { name: 'tcca_name', type: 'VARCHAR(255)', nn: true, description: 'ชื่อและนามสกุลผู้ถูกกล่าวหา' },
      { name: 'tcca_position', type: 'VARCHAR(255)', description: 'ตำแหน่งหน้าที่การงาน' },
      { name: 'tcca_idcard', type: 'VARCHAR(20)', description: 'เลขประจำตัวประชาชน 13 หลัก' },
      { name: 'tcca_agency', type: 'VARCHAR(255)', description: 'หน่วยงานต้นสังกัดของผู้ถูกกล่าวหา' },
      { name: 'is_deleted', type: 'BOOLEAN', default: 'false', description: 'Soft Delete Flag' },
      { name: 'created_datetime', type: 'TIMESTAMP', default: 'now()', description: 'วันเวลาที่สร้างข้อมูล' },
      { name: 'created_by', type: 'INTEGER', description: 'ผู้สร้างข้อมูล' }
    ]
  },

  // 3. tbl_res_accused_offense
  {
    name: 'tbl_res_accused_offense',
    color: '#f87171',
    x: 400,
    y: 1140,
    description: 'ตารางข้อกล่าวหาและฐานความผิดที่ชี้มูลแยกรายบุคคล',
    columns: [
      { name: 'trao_id', type: 'BIGSERIAL', pk: true, ai: true, nn: true, description: 'รหัสฐานความผิดรายบุคคล (Primary Key)' },
      { name: 'tcca_id', type: 'BIGINT', nn: true, description: 'รหัสผู้ถูกกล่าวหา อ้างอิง tbl_cmp_case_accused(tcca_id)' },
      { name: 'trob_id', type: 'BIGINT', nn: true, description: 'รหัสฐานความผิด อ้างอิง tbl_res_offense_basis(trob_id)' },
      { name: 'offense_category', type: 'VARCHAR(50)', nn: true, description: 'หมวดความผิด (CRIMINAL=อาญา, DISCIPLINARY=วินัย)' },
      { name: 'offense_description', type: 'TEXT', description: 'พฤติการณ์ความผิดเฉพาะบุคคล' },
      { name: 'is_deleted', type: 'BOOLEAN', default: 'false', description: 'Soft Delete Flag' },
      { name: 'created_datetime', type: 'TIMESTAMP', default: 'now()', description: 'วันเวลาที่สร้างข้อมูล' }
    ]
  },

  // 4. tbl_res_request
  {
    name: 'tbl_res_request',
    color: '#38bdf8',
    x: 880,
    y: 40,
    description: 'ตารางคำร้องและกระบวนงานเสนอมติคณะกรรมการ ป.ป.ท. (กิจกรรมที่ 7)',
    columns: [
      { name: 'trr_id', type: 'BIGSERIAL', pk: true, ai: true, nn: true, description: 'รหัสคำร้องเสนอมติ (Primary Key)' },
      { name: 'tcc_id', type: 'BIGINT', nn: true, description: 'รหัสสำนวนคดี อ้างอิง tbl_cmp_case(tcc_id)' },
      { name: 'trr_module', type: 'VARCHAR(50)', description: 'โมดูลระบบย่อย (board_resolution)' },
      { name: 'trr_function', type: 'VARCHAR(50)', description: 'ฟังก์ชันงาน (preliminary, ruling, general)' },
      { name: 'trr_status', type: 'CHAR(3)', nn: true, description: 'รหัสสถานะ 3 หลักตาม State Machine (เช่น 005, 011, 110)' },
      { name: 'trr_sla_days', type: 'INTEGER', default: '0', description: 'จำนวนวันทำการที่ใช้ไป' },
      { name: 'trr_sla_limit', type: 'INTEGER', default: '15', description: 'กรอบเวลา SLA ตามประเภทรายงาน (วัน)' },
      { name: 'trr_urgent', type: 'BOOLEAN', default: 'false', description: 'ยื่นขอพิจารณาวาระด่วน' },
      { name: 'trr_signed_secgen', type: 'BOOLEAN', default: 'false', description: 'เลขาธิการฯ ลงนามแล้ว' },
      { name: 'trr_sub_committee', type: 'VARCHAR(50)', description: 'คณะอนุกรรมการกลั่นกรองที่รับผิดชอบ (คณะที่ ๑ - ๘)' },
      { name: 'trr_subcmt_meeting_date', type: 'DATE', description: 'วันที่อนุกรรมการกลั่นกรองประชุม' },
      { name: 'trr_subcmt_resolved_date', type: 'DATE', description: 'วันที่อนุกรรมการกลั่นกรองมีมติ' },
      { name: 'trr_subcmt_sent_board_date', type: 'DATE', description: 'วันที่ส่งเรื่องเข้าสู่บอร์ดใหญ่' },
      { name: 'trr_resolution_stage', type: 'VARCHAR(20)', description: 'ขั้นตอนมติ (7.1, 7.2, 7.3)' },
      { name: 'trr_resolution_code', type: 'VARCHAR(50)', description: 'รหัสประเภทมติของคณะกรรมการ' },
      { name: 'trr_meeting_no', type: 'VARCHAR(50)', description: 'ครั้งที่ประชุมที่นำเข้าพิจารณา (เช่น 38/2569)' },
      { name: 'trr_agenda_no', type: 'VARCHAR(50)', description: 'เลขระเบียบวาระการประชุม (เช่น 5.1)' },
      { name: 'trr_meeting_date', type: 'DATE', description: 'วันที่จัดการประชุมคณะกรรมการ' },
      { name: 'trr_recorded_doc_html', type: 'TEXT', description: 'เนื้อหาร่างรายงานคำวินิจฉัย/มติฉบับเต็ม (HTML)' },
      { name: 'trr_resolution_data', type: 'JSONB', description: 'ข้อมูลมติ รายละเอียดการลงคะแนน และ Snapshot เพิ่มเติม' },
      { name: 'is_deleted', type: 'BOOLEAN', default: 'false', description: 'Soft Delete Flag' },
      { name: 'created_datetime', type: 'TIMESTAMP', default: 'now()', description: 'วันเวลาที่สร้างข้อมูล' },
      { name: 'created_by', type: 'INTEGER', description: 'ผู้สร้างข้อมูล' },
      { name: 'updated_datetime', type: 'TIMESTAMP', description: 'วันเวลาแก้ไขข้อมูลล่าสุด' },
      { name: 'updated_by', type: 'INTEGER', description: 'ผู้แก้ไขข้อมูล' }
    ]
  },

  // 5. tbl_res_request_event
  {
    name: 'tbl_res_request_event',
    color: '#fb923c',
    x: 880,
    y: 850,
    description: 'ตารางประวัติการเปลี่ยนสถานะและการลงนาม (Audit Event Timeline)',
    columns: [
      { name: 'trre_id', type: 'BIGSERIAL', pk: true, ai: true, nn: true, description: 'รหัสเหตุการณ์ Timeline (Primary Key)' },
      { name: 'trr_id', type: 'BIGINT', nn: true, description: 'รหัสคำร้อง อ้างอิง tbl_res_request(trr_id)' },
      { name: 'trre_type', type: 'VARCHAR(50)', nn: true, description: 'ประเภทเหตุการณ์ (STATUS_CHANGE, SIGN, RETURN)' },
      { name: 'trre_from_status', type: 'CHAR(3)', description: 'รหัสสถานะก่อนหน้า' },
      { name: 'trre_to_status', type: 'CHAR(3)', description: 'รหัสสถานะใหม่' },
      { name: 'trre_actor_role', type: 'VARCHAR(50)', nn: true, description: 'บทบาทผู้ปฏิบัติงาน (secgen, chairman, board_sec)' },
      { name: 'trre_note', type: 'TEXT', description: 'ความเห็นประกอบ / หมายเหตุการสั่งการ' },
      { name: 'trre_data', type: 'JSONB', description: 'ข้อมูลบริบทเพิ่มเติมของเหตุการณ์' },
      { name: 'is_deleted', type: 'BOOLEAN', default: 'false', description: 'Soft Delete Flag' },
      { name: 'created_datetime', type: 'TIMESTAMP', default: 'now()', description: 'วันเวลาที่เกิดเหตุการณ์' },
      { name: 'created_by', type: 'INTEGER', description: 'ผู้บันทึกเหตุการณ์' }
    ]
  },

  // 6. tbl_res_calendar
  {
    name: 'tbl_res_calendar',
    color: '#4ade80',
    x: 1360,
    y: 40,
    description: 'ตารางรอบการประชุมคณะกรรมการ ป.ป.ท.',
    columns: [
      { name: 'trc_id', type: 'BIGSERIAL', pk: true, ai: true, nn: true, description: 'รหัสรอบการประชุม (Primary Key)' },
      { name: 'trc_name', type: 'VARCHAR(50)', nn: true, description: 'ชื่อครั้งที่ประชุม (เช่น 38/2569)' },
      { name: 'trc_date', type: 'DATE', nn: true, description: 'วันที่จัดการประชุม' },
      { name: 'trc_start_time', type: 'TIME', default: "'09:30:00'", description: 'เวลาเริ่มประชุม' },
      { name: 'trc_end_time', type: 'TIME', default: "'16:30:00'", description: 'เวลาสิ้นสุดประชุม' },
      { name: 'trc_status', type: 'CHAR(1)', default: "'0'", description: 'สถานะรอบประชุม (0=รอประชุม, 1=เสร็จสิ้น)' },
      { name: 'trc_confirmed', type: 'BOOLEAN', default: 'false', description: 'ยืนยันระเบียบวาระพร้อมประชุม' },
      { name: 'is_deleted', type: 'BOOLEAN', default: 'false', description: 'Soft Delete Flag' },
      { name: 'created_datetime', type: 'TIMESTAMP', default: 'now()', description: 'วันเวลาที่สร้างข้อมูล' },
      { name: 'created_by', type: 'INTEGER', description: 'ผู้สร้างข้อมูล' },
      { name: 'updated_datetime', type: 'TIMESTAMP', description: 'วันเวลาแก้ไขข้อมูลล่าสุด' },
      { name: 'updated_by', type: 'INTEGER', description: 'ผู้แก้ไขข้อมูล' }
    ]
  },

  // 7. tbl_res_calendar_item
  {
    name: 'tbl_res_calendar_item',
    color: '#10b981',
    x: 1360,
    y: 460,
    description: 'ตารางระเบียบวาระการประชุมแต่ละรายการ',
    columns: [
      { name: 'trci_id', type: 'BIGSERIAL', pk: true, ai: true, nn: true, description: 'รหัสระเบียบวาระ (Primary Key)' },
      { name: 'trc_id', type: 'BIGINT', nn: true, description: 'รหัสรอบประชุม อ้างอิง tbl_res_calendar(trc_id)' },
      { name: 'trci_number', type: 'VARCHAR(50)', nn: true, description: 'ลำดับวาระ (เช่น 5.1, 5.2)' },
      { name: 'trci_topic', type: 'TEXT', nn: true, description: 'ชื่อเรื่องระเบียบวาระการประชุม' },
      { name: 'category', type: 'VARCHAR(50)', description: 'หมวดวาระ (finding, preliminary, policy)' },
      { name: 'remark', type: 'TEXT', description: 'หมายเหตุระเบียบวาระ' },
      { name: 'trci_presenters', type: 'JSONB', description: 'รายชื่อผู้ชี้แจงวาระการประชุม (Array)' },
      { name: 'is_deleted', type: 'BOOLEAN', default: 'false', description: 'Soft Delete Flag' },
      { name: 'created_datetime', type: 'TIMESTAMP', default: 'now()', description: 'วันเวลาที่สร้างข้อมูล' },
      { name: 'created_by', type: 'INTEGER', description: 'ผู้สร้างข้อมูล' },
      { name: 'updated_datetime', type: 'TIMESTAMP', description: 'วันเวลาแก้ไขข้อมูลล่าสุด' },
      { name: 'updated_by', type: 'INTEGER', description: 'ผู้แก้ไขข้อมูล' }
    ]
  },

  // 8. tbl_res_calendar_item_case
  {
    name: 'tbl_res_calendar_item_case',
    color: '#14b8a6',
    x: 1360,
    y: 920,
    description: 'ตารางเชื่อมโยงระเบียบวาระกับสำนวนคดี (Junction Table รองรับ Batch Agenda)',
    columns: [
      { name: 'trcic_id', type: 'BIGSERIAL', pk: true, ai: true, nn: true, description: 'รหัสการเชื่อมโยงวาระกับคดี (Primary Key)' },
      { name: 'trci_id', type: 'BIGINT', nn: true, description: 'รหัสวาระ อ้างอิง tbl_res_calendar_item(trci_id)' },
      { name: 'trr_id', type: 'BIGINT', nn: true, description: 'รหัสคำร้อง อ้างอิง tbl_res_request(trr_id)' },
      { name: 'trcic_remark', type: 'TEXT', description: 'หมายเหตุในบัญชีแนบสำนวนของวาระ' },
      { name: 'is_deleted', type: 'BOOLEAN', default: 'false', description: 'Soft Delete Flag' },
      { name: 'created_datetime', type: 'TIMESTAMP', default: 'now()', description: 'วันเวลาที่บรรจุสำนวนเข้าวาระ' },
      { name: 'created_by', type: 'INTEGER', description: 'ผู้สร้างข้อมูล' }
    ]
  },

  // 9. tbl_res_calendar_item_qualifier
  {
    name: 'tbl_res_calendar_item_qualifier',
    color: '#06b6d4',
    x: 1820,
    y: 460,
    description: 'ตารางเชื่อมโยงป้ายคุณสมบัติกับวาระการประชุม',
    columns: [
      { name: 'trciq_id', type: 'BIGSERIAL', pk: true, ai: true, nn: true, description: 'รหัสการผูกคุณสมบัติวาระ (Primary Key)' },
      { name: 'trci_id', type: 'BIGINT', nn: true, description: 'รหัสวาระ อ้างอิง tbl_res_calendar_item(trci_id)' },
      { name: 'trqf_id', type: 'BIGINT', nn: true, description: 'รหัสคุณสมบัติ อ้างอิง tbl_res_agenda_qualifier(trqf_id)' },
      { name: 'is_deleted', type: 'BOOLEAN', default: 'false', description: 'Soft Delete Flag' },
      { name: 'created_datetime', type: 'TIMESTAMP', default: 'now()', description: 'วันเวลาที่สร้างข้อมูล' }
    ]
  },

  // 10. tbl_res_agenda_qualifier
  {
    name: 'tbl_res_agenda_qualifier',
    color: '#0284c7',
    x: 1820,
    y: 40,
    description: 'ตาราง Master คำอธิบายคุณสมบัติและป้ายกำกับของระเบียบวาระ',
    columns: [
      { name: 'trqf_id', type: 'BIGSERIAL', pk: true, ai: true, nn: true, description: 'รหัสคุณสมบัติวาระ (Primary Key)' },
      { name: 'trqf_code', type: 'VARCHAR(50)', nn: true, uq: true, description: 'รหัสคุณสมบัติ (เช่น ACCEPT_M18_4, SUBCMT_AGREE)' },
      { name: 'trqf_group', type: 'VARCHAR(50)', nn: true, description: 'กลุ่มคุณสมบัติ (nature, subcommittee_stance, routing)' },
      { name: 'trqf_label', type: 'VARCHAR(255)', nn: true, description: 'ข้อความป้ายกำกับภาษาไทย' },
      { name: 'trqf_sort_order', type: 'INTEGER', default: '0', description: 'ลำดับการแสดงผล' },
      { name: 'is_deleted', type: 'BOOLEAN', default: 'false', description: 'Soft Delete Flag' },
      { name: 'created_datetime', type: 'TIMESTAMP', default: 'now()', description: 'วันเวลาที่สร้างข้อมูล' }
    ]
  },

  // 11. tbl_law_pacc_article
  {
    name: 'tbl_law_pacc_article',
    color: '#6366f1',
    x: 2280,
    y: 40,
    description: 'ตาราง Master มาตราของ พ.ร.บ. มาตรการของฝ่ายบริหารในการป้องกันและปราบปรามการทุจริต พ.ศ. 2551',
    columns: [
      { name: 'tla_id', type: 'BIGSERIAL', pk: true, ai: true, nn: true, description: 'รหัสมาตรากฎหมาย (Primary Key)' },
      { name: 'tla_article_no', type: 'VARCHAR(50)', nn: true, uq: true, description: 'เลขมาตรา (เช่น ม.18/4, ม.24, ม.32)' },
      { name: 'tla_article_text', type: 'TEXT', nn: true, description: 'สรุปใจความสำคัญของมาตราตามกฎหมาย' },
      { name: 'tla_topic', type: 'VARCHAR(255)', nn: true, description: 'หัวข้อ/เรื่องของมาตรา' },
      { name: 'tla_source_doc', type: 'VARCHAR(100)', default: "'law_pacc_68.pdf'", description: 'ชื่อเอกสารอ้างอิงต้นฉบับ' },
      { name: 'tla_sort_order', type: 'INTEGER', default: '0', description: 'ลำดับการแสดงผล' },
      { name: 'is_deleted', type: 'BOOLEAN', default: 'false', description: 'Soft Delete Flag' },
      { name: 'created_datetime', type: 'TIMESTAMP', default: 'now()', description: 'วันเวลาที่สร้างข้อมูล' }
    ]
  },

  // 12. tbl_res_resolution_type
  {
    name: 'tbl_res_resolution_type',
    color: '#8b5cf6',
    x: 2280,
    y: 460,
    description: 'ตาราง Master ประเภทมติของคณะกรรมการ ป.ป.ท. (ครอบคลุม 7.1, 7.2, 7.3)',
    columns: [
      { name: 'trrt_id', type: 'BIGSERIAL', pk: true, ai: true, nn: true, description: 'รหัสประเภทมติ (Primary Key)' },
      { name: 'trrt_proc_type', type: 'VARCHAR(10)', nn: true, description: 'สายกระบวนงาน (7.1, 7.2, 7.3)' },
      { name: 'trrt_code', type: 'VARCHAR(50)', nn: true, description: 'รหัสประเภทมติ (เช่น GUILTY_72, NOT_ACCEPTED)' },
      { name: 'trrt_group', type: 'VARCHAR(100)', nn: true, description: 'กลุ่มมติ' },
      { name: 'trrt_label', type: 'VARCHAR(255)', nn: true, description: 'ชื่อมติภาษาไทย' },
      { name: 'trrt_doc_name', type: 'VARCHAR(255)', nn: true, description: 'ชื่อแบบเอกสารที่เกี่ยวข้อง (เช่น ปปท. ๕-๐๒)' },
      { name: 'trrt_signer', type: 'VARCHAR(100)', description: 'ผู้ลงนามตามมติ (เลขาธิการฯ, ประธานฯ)' },
      { name: 'trrt_notice_days', type: 'INTEGER', default: '0', description: 'จำนวนวันที่ต้องแจ้งผลผู้ถูกกล่าวหา (วัน)' },
      { name: 'trrt_notice_basis', type: 'VARCHAR(100)', description: 'ฐานกฎหมายที่กำหนดระยะเวลาแจ้งผล' },
      { name: 'trrt_needs_law_ref', type: 'BOOLEAN', default: 'false', description: 'ต้องระบุฐานกฎหมายเพิ่มเติมหรือไม่' },
      { name: 'trrt_needs_destination', type: 'BOOLEAN', default: 'false', description: 'ต้องระบุหน่วยงานส่งต่อหรือไม่' },
      { name: 'trrt_requires_reason', type: 'BOOLEAN', default: 'false', description: 'ต้องระบุเหตุผลประกอบมติหรือไม่' },
      { name: 'trrt_reason_note', type: 'TEXT', description: 'คำอธิบายเหตุผลประกอบ' },
      { name: 'trrt_needs_guilty_track', type: 'BOOLEAN', default: 'false', description: 'ต้องแยกสายอาญา/วินัยหรือไม่' },
      { name: 'trrt_sort_order', type: 'INTEGER', default: '0', description: 'ลำดับการแสดงผล' },
      { name: 'is_deleted', type: 'BOOLEAN', default: 'false', description: 'Soft Delete Flag' },
      { name: 'created_datetime', type: 'TIMESTAMP', default: 'now()', description: 'วันเวลาที่สร้างข้อมูล' }
    ]
  },

  // 13. tbl_res_resolution_type_law
  {
    name: 'tbl_res_resolution_type_law',
    color: '#ec4899',
    x: 2280,
    y: 1100,
    description: 'ตารางเชื่อมโยงประเภทมติกับมาตรากฎหมาย พ.ร.บ. ป.ป.ท. (Many-to-Many)',
    columns: [
      { name: 'trrtl_id', type: 'BIGSERIAL', pk: true, ai: true, nn: true, description: 'รหัสการเชื่อมโยงมติกับกฎหมาย (Primary Key)' },
      { name: 'trrt_id', type: 'BIGINT', nn: true, description: 'รหัสมติ อ้างอิง tbl_res_resolution_type(trrt_id)' },
      { name: 'tla_id', type: 'BIGINT', nn: true, description: 'รหัสมาตรา อ้างอิง tbl_law_pacc_article(tla_id)' },
      { name: 'trrtl_note', type: 'TEXT', description: 'หมายเหตุการปรับใช้บทบัญญัติ' },
      { name: 'is_deleted', type: 'BOOLEAN', default: 'false', description: 'Soft Delete Flag' },
      { name: 'created_datetime', type: 'TIMESTAMP', default: 'now()', description: 'วันเวลาที่สร้างข้อมูล' }
    ]
  },

  // 14. tbl_res_forward_target
  {
    name: 'tbl_res_forward_target',
    color: '#d946ef',
    x: 2740,
    y: 40,
    description: 'ตาราง Master หน่วยงานปลายทางที่ส่งต่อมติคณะกรรมการ ป.ป.ท.',
    columns: [
      { name: 'trft_id', type: 'BIGSERIAL', pk: true, ai: true, nn: true, description: 'รหัสหน่วยงานส่งต่อ (Primary Key)' },
      { name: 'trft_code', type: 'VARCHAR(50)', nn: true, uq: true, description: 'รหัสหน่วยงาน (เช่น OSAG, NACC, DISCIPLINE)' },
      { name: 'trft_label', type: 'VARCHAR(255)', nn: true, description: 'ชื่อหน่วยงานปลายทางภาษาไทย' },
      { name: 'trft_external', type: 'BOOLEAN', default: 'false', description: 'เป็นหน่วยงานภายนอกหรือไม่' },
      { name: 'trft_require_signed_scan', type: 'BOOLEAN', default: 'false', description: 'ต้องแนบไฟล์สแกนคำสั่งลงนาม' },
      { name: 'trft_require_archive_copy', type: 'BOOLEAN', default: 'false', description: 'ต้องคัดสำนวนเก็บเป็นหลักฐาน ม.18/1' },
      { name: 'trft_statutory_sla_days', type: 'INTEGER', description: 'กรอบเวลาส่งตามกฎหมาย (วัน)' },
      { name: 'trft_statutory_basis', type: 'VARCHAR(100)', description: 'ฐานกฎหมายของกรอบเวลา' },
      { name: 'trft_statutory_law_article_id', type: 'BIGINT', description: 'รหัสมาตรากฎหมายที่กำหนดกรอบเวลา' },
      { name: 'trft_tracking_sla_days', type: 'INTEGER', description: 'กรอบเวลาติดตามผล (วัน)' },
      { name: 'trft_tracking_basis', type: 'VARCHAR(100)', description: 'ฐานกฎหมายในการติดตามผล' },
      { name: 'trft_archive_basis', type: 'VARCHAR(100)', description: 'ฐานกฎหมายการเก็บสำนวน' },
      { name: 'trft_archive_law_article_id', type: 'BIGINT', description: 'รหัสมาตราการเก็บสำนวน' },
      { name: 'trft_doc_name', type: 'VARCHAR(255)', description: 'ชื่อแบบหนังสือส่งเรื่อง' },
      { name: 'trft_sort_order', type: 'INTEGER', default: '0', description: 'ลำดับการแสดงผล' },
      { name: 'is_deleted', type: 'BOOLEAN', default: 'false', description: 'Soft Delete Flag' },
      { name: 'created_datetime', type: 'TIMESTAMP', default: 'now()', description: 'วันเวลาที่สร้างข้อมูล' }
    ]
  },

  // 15. tbl_res_offense_basis
  {
    name: 'tbl_res_offense_basis',
    color: '#e11d48',
    x: 2740,
    y: 750,
    description: 'ตาราง Master ฐานความผิดกฎหมายทั่วไป (ประมวลกฎหมายอาญา, วินัยข้าราชการ)',
    columns: [
      { name: 'trob_id', type: 'BIGSERIAL', pk: true, ai: true, nn: true, description: 'รหัสฐานความผิด (Primary Key)' },
      { name: 'trob_group', type: 'VARCHAR(50)', description: 'หมวดกฎหมาย (criminal, discipline)' },
      { name: 'trob_law_name', type: 'VARCHAR(255)', nn: true, description: 'ชื่อกฎหมาย (เช่น ประมวลกฎหมายอาญา)' },
      { name: 'trob_article_no', type: 'VARCHAR(50)', description: 'เลขมาตรา (เช่น ม.157, ม.149)' },
      { name: 'trob_article_label', type: 'TEXT', nn: true, description: 'ชื่อฐานความผิดภาษาไทยฉบับเต็ม' },
      { name: 'trob_prescription_years_principal', type: 'INTEGER', description: 'อายุความตัวการ (ปี)' },
      { name: 'trob_prescription_years_accessory', type: 'INTEGER', description: 'อายุความผู้สนับสนุน (ปี)' },
      { name: 'p_principal', type: 'VARCHAR(100)', description: 'ข้อความวรรคอายุความตัวการ' },
      { name: 'p_accessory', type: 'VARCHAR(100)', description: 'ข้อความวรรคอายุความผู้สนับสนุน' },
      { name: 'trob_sort_order', type: 'INTEGER', default: '0', description: 'ลำดับการแสดงผล' },
      { name: 'is_deleted', type: 'BOOLEAN', default: 'false', description: 'Soft Delete Flag' },
      { name: 'created_datetime', type: 'TIMESTAMP', default: 'now()', description: 'วันเวลาที่สร้างข้อมูล' }
    ]
  },

  // 16. tbl_res_calendar_item_history
  {
    name: 'tbl_res_calendar_item_history',
    color: '#f43f5e',
    x: 2080,
    y: 950,
    description: 'ตารางบันทึกประวัติการแก้ไขเปลี่ยนแปลงรายการระเบียบวาระการประชุม',
    columns: [
      { name: 'trcih_id', type: 'BIGSERIAL', pk: true, ai: true, nn: true, description: 'รหัสประวัติการแก้ไขวาระ (Primary Key)' },
      { name: 'trci_id', type: 'BIGINT', nn: true, description: 'รหัสอ้างอิงวาระการประชุม (FK -> tbl_res_calendar_item)' },
      { name: 'trcih_detail', type: 'TEXT', description: 'รายละเอียดข้อมูลที่มีการแก้ไขเปลี่ยนแปลง' },
      { name: 'trcih_remark', type: 'TEXT', description: 'หมายเหตุหรือเหตุผลในการแก้ไข' },
      { name: 'created_datetime', type: 'TIMESTAMPTZ', default: 'now()', description: 'วันเวลาที่บันทึกประวัติ' },
      { name: 'created_by', type: 'VARCHAR(100)', description: 'ผู้ใช้งานที่ทำการแก้ไข' }
    ]
  },

  // 17. tbl_res_attachment
  {
    name: 'tbl_res_attachment',
    color: '#0284c7',
    x: 820,
    y: 950,
    description: 'ตารางคลังจัดเก็บไฟล์เอกสารแนบและพยานหลักฐาน',
    columns: [
      { name: 'trat_id', type: 'BIGSERIAL', pk: true, ai: true, nn: true, description: 'รหัสไฟล์แนบ (Primary Key)' },
      { name: 'tcc_id', type: 'BIGINT', description: 'รหัสสำนวนคดี (FK -> tbl_cmp_case)' },
      { name: 'trr_id', type: 'BIGINT', description: 'รหัสคำร้องขอบรรจุวาระ (FK -> tbl_res_request)' },
      { name: 'trat_filename', type: 'VARCHAR(255)', nn: true, description: 'ชื่อไฟล์ต้นฉบับ' },
      { name: 'trat_storage_path', type: 'TEXT', nn: true, description: 'ตำแหน่งจัดเก็บไฟล์ใน Storage' },
      { name: 'trat_mime_type', type: 'VARCHAR(100)', description: 'MIME Type ของไฟล์' },
      { name: 'trat_size_bytes', type: 'BIGINT', description: 'ขนาดไฟล์ (Bytes)' },
      { name: 'trat_uploaded_by_role', type: 'VARCHAR(50)', description: 'บทบาทผู้ใช้ที่อัปโหลด' },
      { name: 'is_deleted', type: 'BOOLEAN', default: 'false', description: 'Soft Delete Flag' },
      { name: 'created_datetime', type: 'TIMESTAMPTZ', default: 'now()', description: 'วันเวลาที่อัปโหลด' }
    ]
  },

  // 18. ecmis_notification_read_receipt
  {
    name: 'ecmis_notification_read_receipt',
    color: '#64748b',
    x: 2080,
    y: 1350,
    description: 'ตารางบันทึกสถานะการอ่านการแจ้งเตือนของผู้ใช้งานในระบบ',
    columns: [
      { name: 'notification_id', type: 'VARCHAR(255)', pk: true, nn: true, description: 'รหัสการแจ้งเตือน (Composite PK)' },
      { name: 'user_id', type: 'VARCHAR(50)', pk: true, nn: true, description: 'รหัสบทบาทหรือผู้ใช้งานที่เปิดอ่าน (Composite PK)' },
      { name: 'read_at', type: 'TIMESTAMPTZ', default: 'now()', description: 'วันเวลาที่เปิดอ่านแจ้งเตือน' }
    ]
  },

  // 19. tbl_res_calendar_history
  {
    name: 'tbl_res_calendar_history',
    color: '#f43f5e',
    x: 820,
    y: 1750,
    description: 'ตารางบันทึกประวัติการแก้ไขข้อมูลรอบการประชุม',
    columns: [
      { name: 'trch_id', type: 'BIGSERIAL', pk: true, ai: true, nn: true, description: 'รหัสประวัติการแก้ไขรอบประชุม (Primary Key)' },
      { name: 'trc_id', type: 'BIGINT', nn: true, description: 'รหัสรอบการประชุม (FK -> tbl_res_calendar)' },
      { name: 'trch_detail', type: 'TEXT', description: 'รายละเอียดข้อมูลที่มีการแก้ไขเปลี่ยนแปลง' },
      { name: 'trch_remark', type: 'TEXT', description: 'หมายเหตุหรือเหตุผลในการแก้ไข' },
      { name: 'created_datetime', type: 'TIMESTAMPTZ', default: 'now()', description: 'วันเวลาที่บันทึกประวัติ' },
      { name: 'created_by', type: 'VARCHAR(100)', description: 'ผู้ใช้งานที่ทำการแก้ไข' }
    ]
  },

  // 20. tbl_res_request_history
  {
    name: 'tbl_res_request_history',
    color: '#f43f5e',
    x: 1240,
    y: 1750,
    description: 'ตารางบันทึกประวัติการแก้ไขข้อมูลคำร้องขอบรรจุวาระ',
    columns: [
      { name: 'trrh_id', type: 'BIGSERIAL', pk: true, ai: true, nn: true, description: 'รหัสประวัติการแก้ไขคำร้อง (Primary Key)' },
      { name: 'trr_id', type: 'BIGINT', nn: true, description: 'รหัสคำร้อง (FK -> tbl_res_request)' },
      { name: 'trrh_detail', type: 'TEXT', description: 'รายละเอียดข้อมูลที่มีการแก้ไขเปลี่ยนแปลง' },
      { name: 'trrh_remark', type: 'TEXT', description: 'หมายเหตุหรือเหตุผลในการแก้ไข' },
      { name: 'created_datetime', type: 'TIMESTAMPTZ', default: 'now()', description: 'วันเวลาที่บันทึกประวัติ' },
      { name: 'created_by', type: 'VARCHAR(100)', description: 'ผู้ใช้งานที่ทำการแก้ไข' }
    ]
  },

  // 21. tbl_res_request_item
  {
    name: 'tbl_res_request_item',
    color: '#8b5cf6',
    x: 1660,
    y: 1750,
    description: 'ตารางรายการประกอบหรือสำนวนย่อยของคำร้องขอบรรจุวาระ',
    columns: [
      { name: 'trri_id', type: 'BIGSERIAL', pk: true, ai: true, nn: true, description: 'รหัสรายการประกอบคำร้อง (Primary Key)' },
      { name: 'trr_id', type: 'BIGINT', nn: true, description: 'รหัสคำร้อง (FK -> tbl_res_request)' },
      { name: 'trri_seq', type: 'INTEGER', description: 'ลำดับรายการย่อย' },
      { name: 'trri_title', type: 'VARCHAR(255)', description: 'ชื่อรายการย่อย' },
      { name: 'created_datetime', type: 'TIMESTAMPTZ', default: 'now()', description: 'วันเวลาที่สร้างข้อมูล' }
    ]
  }
];

const tables = rawTables.map(buildTable);

// Build Relations
const rawRelations = [
  // 1. tbl_cmp_case (tcc_id) -> tbl_cmp_case_accused (tcc_id)
  { fromTable: 'tbl_cmp_case', fromCol: 'tcc_id', toTable: 'tbl_cmp_case_accused', toCol: 'tcc_id' },
  // 2. tbl_cmp_case (tcc_id) -> tbl_res_request (tcc_id)
  { fromTable: 'tbl_cmp_case', fromCol: 'tcc_id', toTable: 'tbl_res_request', toCol: 'tcc_id' },
  // 3. tbl_cmp_case_accused (tcca_id) -> tbl_res_accused_offense (tcca_id)
  { fromTable: 'tbl_cmp_case_accused', fromCol: 'tcca_id', toTable: 'tbl_res_accused_offense', toCol: 'tcca_id' },
  // 4. tbl_res_offense_basis (trob_id) -> tbl_res_accused_offense (trob_id)
  { fromTable: 'tbl_res_offense_basis', fromCol: 'trob_id', toTable: 'tbl_res_accused_offense', toCol: 'trob_id' },
  // 5. tbl_res_request (trr_id) -> tbl_res_request_event (trr_id)
  { fromTable: 'tbl_res_request', fromCol: 'trr_id', toTable: 'tbl_res_request_event', toCol: 'trr_id' },
  // 6. tbl_res_calendar (trc_id) -> tbl_res_calendar_item (trc_id)
  { fromTable: 'tbl_res_calendar', fromCol: 'trc_id', toTable: 'tbl_res_calendar_item', toCol: 'trc_id' },
  // 7. tbl_res_calendar_item (trci_id) -> tbl_res_calendar_item_case (trci_id)
  { fromTable: 'tbl_res_calendar_item', fromCol: 'trci_id', toTable: 'tbl_res_calendar_item_case', toCol: 'trci_id' },
  // 8. tbl_res_request (trr_id) -> tbl_res_calendar_item_case (trr_id)
  { fromTable: 'tbl_res_request', fromCol: 'trr_id', toTable: 'tbl_res_calendar_item_case', toCol: 'trr_id' },
  // 9. tbl_res_calendar_item (trci_id) -> tbl_res_calendar_item_qualifier (trci_id)
  { fromTable: 'tbl_res_calendar_item', fromCol: 'trci_id', toTable: 'tbl_res_calendar_item_qualifier', toCol: 'trci_id' },
  // 10. tbl_res_agenda_qualifier (trqf_id) -> tbl_res_calendar_item_qualifier (trqf_id)
  { fromTable: 'tbl_res_agenda_qualifier', fromCol: 'trqf_id', toTable: 'tbl_res_calendar_item_qualifier', toCol: 'trqf_id' },
  // 11. tbl_res_resolution_type (trrt_id) -> tbl_res_resolution_type_law (trrt_id)
  { fromTable: 'tbl_res_resolution_type', fromCol: 'trrt_id', toTable: 'tbl_res_resolution_type_law', toCol: 'trrt_id' },
  // 12. tbl_law_pacc_article (tla_id) -> tbl_res_resolution_type_law (tla_id)
  { fromTable: 'tbl_law_pacc_article', fromCol: 'tla_id', toTable: 'tbl_res_resolution_type_law', toCol: 'tla_id' },
  // 13. tbl_res_calendar_item (trci_id) -> tbl_res_calendar_item_history (trci_id)
  { fromTable: 'tbl_res_calendar_item', fromCol: 'trci_id', toTable: 'tbl_res_calendar_item_history', toCol: 'trci_id' },
  // 14. tbl_cmp_case (tcc_id) -> tbl_res_attachment (tcc_id)
  { fromTable: 'tbl_cmp_case', fromCol: 'tcc_id', toTable: 'tbl_res_attachment', toCol: 'tcc_id' },
  // 15. tbl_res_request (trr_id) -> tbl_res_attachment (trr_id)
  { fromTable: 'tbl_res_request', fromCol: 'trr_id', toTable: 'tbl_res_attachment', toCol: 'trr_id' },
  // 16. tbl_res_calendar (trc_id) -> tbl_res_calendar_history (trc_id)
  { fromTable: 'tbl_res_calendar', fromCol: 'trc_id', toTable: 'tbl_res_calendar_history', toCol: 'trc_id' },
  // 17. tbl_res_request (trr_id) -> tbl_res_request_history (trr_id)
  { fromTable: 'tbl_res_request', fromCol: 'trr_id', toTable: 'tbl_res_request_history', toCol: 'trr_id' },
  // 18. tbl_res_request (trr_id) -> tbl_res_request_item (trr_id)
  { fromTable: 'tbl_res_request', fromCol: 'trr_id', toTable: 'tbl_res_request_item', toCol: 'trr_id' }
];

const relations = rawRelations.map(r => {
  const fT = tableMap[r.fromTable];
  const tT = tableMap[r.toTable];
  return {
    id: genRelId(),
    fromTable: fT.id,
    fromCol: fT.colMap[r.fromCol],
    toTable: tT.id,
    toCol: tT.colMap[r.toCol],
    type: '1:N',
    fromOpt: 'optional',
    toOpt: 'optional',
    fromSide: 'right',
    toSide: 'left'
  };
});

const drawDbPayload = {
  tables,
  relations,
  platform: 'postgresql'
};

const jsonStr = JSON.stringify(drawDbPayload, null, 2);

// Targets
const targets = [
  'C:\\Users\\Toon\\OneDrive\\Documents\\7_V1.1.json',
  path.resolve(__dirname, '..', 'data', '7_V1.1.json'),
  'D:\\Samart-W\\กจ.7\\7_V1.1.json'
];

for (const target of targets) {
  try {
    const dir = path.dirname(target);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(target, jsonStr, 'utf8');
    console.log('✅ Created:', target);
  } catch (err) {
    console.warn('⚠️ Could not write to', target, err.message);
  }
}

console.log(`\n🎉 Success! Total tables: ${tables.length}, Total relations: ${relations.length}`);
