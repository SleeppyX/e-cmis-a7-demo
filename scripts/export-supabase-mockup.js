/**
 * 📦 Supabase Mockup Database Exporter
 * 
 * Exports all 16 mockup database tables from Supabase:
 * 1. Consolidated JSON at data/supabase-mockup.json
 * 2. Individual table JSON arrays at data/tables/<table_name>.json
 * 
 * Run: npm run export:mockup
 */

const fs = require('fs');
const path = require('path');
const { sbFetch } = require('./lib/supabase-rest');

const TABLES = [
  // Core Case & Request Data
  { name: 'tbl_cmp_case', filterDeleted: true, desc: 'สำนวนคดี' },
  { name: 'tbl_cmp_case_accused', filterDeleted: true, desc: 'ผู้ถูกกล่าวหา' },
  { name: 'tbl_res_accused_offense', filterDeleted: true, desc: 'ฐานความผิดรายบุคคล' },
  { name: 'tbl_res_request', filterDeleted: true, desc: 'คำขอบรรจุวาระและสถานะ' },
  { name: 'tbl_res_request_event', filterDeleted: true, desc: 'ประวัติการเปลี่ยนสถานะ (Audit Event)' },
  { name: 'tbl_res_attachment', filterDeleted: true, desc: 'คลังไฟล์เอกสารแนบและพยานหลักฐาน' },

  // Calendar & Agenda Data
  { name: 'tbl_res_calendar', filterDeleted: true, desc: 'รอบการประชุม' },
  { name: 'tbl_res_calendar_history', filterDeleted: false, desc: 'ประวัติรอบการประชุม' },
  { name: 'tbl_res_calendar_item', filterDeleted: true, desc: 'รายการวาระการประชุม' },
  { name: 'tbl_res_calendar_item_case', filterDeleted: true, desc: 'การผูกสำนวนคดีเข้าวาระ' },
  { name: 'tbl_res_calendar_item_qualifier', filterDeleted: true, desc: 'คุณสมบัติของวาระการประชุม' },
  { name: 'tbl_res_calendar_item_history', filterDeleted: false, desc: 'ประวัติวาระการประชุม' },
  { name: 'tbl_res_agenda_qualifier', filterDeleted: true, desc: 'Master คุณสมบัติวาระ' },
  { name: 'tbl_res_request_history', filterDeleted: false, desc: 'ประวัติคำร้องขอบรรจุวาระ' },
  { name: 'tbl_res_request_item', filterDeleted: false, desc: 'รายการประกอบคำร้อง' },

  // Master Data & Taxonomy
  { name: 'tbl_law_pacc_article', filterDeleted: true, desc: 'มาตรา พ.ร.บ. ป.ป.ท.' },
  { name: 'tbl_res_resolution_type', filterDeleted: true, desc: 'ประเภทมติ' },
  { name: 'tbl_res_resolution_type_law', filterDeleted: true, desc: 'ความสัมพันธ์ประเภทมติและมาตรา' },
  { name: 'tbl_res_forward_target', filterDeleted: true, desc: 'หน่วยงานส่งต่อ' },
  { name: 'tbl_res_offense_basis', filterDeleted: true, desc: 'ฐานความผิด' },

  // System & Notification
  { name: 'ecmis_notification_read_receipt', filterDeleted: false, desc: 'สถานะการอ่านแจ้งเตือน' }
];

const OUTPUT_DIR = path.resolve(__dirname, '..', 'data');
const TABLES_DIR = path.join(OUTPUT_DIR, 'tables');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'supabase-mockup.json');

async function fetchTableData(tableDef) {
  const PAGE_SIZE = 1000;
  let offset = 0;
  let allRows = [];

  while (true) {
    let query = `${tableDef.name}?select=*&limit=${PAGE_SIZE}&offset=${offset}`;
    if (tableDef.filterDeleted) {
      query += '&is_deleted=eq.false';
    }

    const res = await sbFetch(query);
    if (!res.ok) {
      throw new Error(`Failed to fetch table '${tableDef.name}': status ${res.status}, error: ${JSON.stringify(res.data)}`);
    }

    const rows = Array.isArray(res.data) ? res.data : [];
    allRows = allRows.concat(rows);

    if (rows.length < PAGE_SIZE) {
      break;
    }
    offset += PAGE_SIZE;
  }

  return allRows;
}

async function exportMockup() {
  console.log('====================================================');
  console.log(' 🚀 E-CMIS SUPABASE MOCKUP DATA EXPORTER');
  console.log('====================================================\n');
  console.log(`Source Supabase Endpoint: https://ljhabbwjxnoucrcrsoii.supabase.co`);
  console.log(`Consolidated File:       ${OUTPUT_FILE}`);
  console.log(`Per-table Directory:     ${TABLES_DIR}\n`);

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  if (!fs.existsSync(TABLES_DIR)) fs.mkdirSync(TABLES_DIR, { recursive: true });

  const exportBundle = {};
  let totalRows = 0;

  for (let i = 0; i < TABLES.length; i++) {
    const t = TABLES[i];
    process.stdout.write(`[${i + 1}/${TABLES.length}] Fetching ${t.name} (${t.desc})... `);
    try {
      const rows = await fetchTableData(t);
      exportBundle[t.name] = rows;
      totalRows += rows.length;

      // Also write individual table file (pure array)
      const perTablePath = path.join(TABLES_DIR, `${t.name}.json`);
      fs.writeFileSync(perTablePath, JSON.stringify(rows, null, 2), 'utf8');

      console.log(`✅ ${rows.length} rows`);
    } catch (err) {
      console.log(`❌ ERROR`);
      console.error(err.message);
      process.exit(1);
    }
  }

  console.log('\n💾 Writing consolidated JSON file...');
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(exportBundle, null, 2), 'utf8');

  const stats = fs.statSync(OUTPUT_FILE);
  const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);

  console.log('====================================================');
  console.log(`✨ Export completed successfully!`);
  console.log(`📄 Consolidated: ${OUTPUT_FILE} (~${sizeMb} MB)`);
  console.log(`📁 Per-table:    ${TABLES_DIR} (16 files)`);
  console.log(`🔢 Total Active Rows: ${totalRows.toLocaleString()}`);
  console.log('====================================================\n');
}

if (require.main === module) {
  exportMockup().catch((err) => {
    console.error('Fatal export error:', err);
    process.exit(1);
  });
}

module.exports = { exportMockup, TABLES };
