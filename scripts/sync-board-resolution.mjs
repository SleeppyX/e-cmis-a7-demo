#!/usr/bin/env node
/**
 * board-resolution/scripts/sync-board-resolution.mjs
 * 
 * Synchronizes Activity 7 (Meeting & Resolution Management) from e-cmis-a7-demo
 * into ecmis/board-resolution, cleans up orphan files, and injects shared hub tags.
 *
 * Usage:
 *   node board-resolution/scripts/sync-board-resolution.mjs --check
 *   node board-resolution/scripts/sync-board-resolution.mjs --apply
 *   node board-resolution/scripts/sync-board-resolution.mjs --source "/path/to/e-cmis-a7-demo" --apply
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEST_DIR = path.resolve(__dirname, '..');

// Default source directory
const DEFAULT_SOURCE = path.resolve(DEST_DIR, '../../e-cmis demo/e-cmis-a7-demo');

const args = process.argv.slice(2);
let sourceDir = DEFAULT_SOURCE;
let isApply = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--apply') {
    isApply = true;
  } else if (args[i] === '--check') {
    isApply = false;
  } else if (args[i] === '--source' && args[i + 1]) {
    sourceDir = path.resolve(args[i + 1]);
    i++;
  }
}

console.log(`\n===============================================================`);
console.log(`📦 E-CMIS Activity 7 (board-resolution) Sync Engine`);
console.log(`===============================================================`);
console.log(`  Source     : ${sourceDir}`);
console.log(`  Destination: ${DEST_DIR}`);
console.log(`  Mode       : ${isApply ? 'APPLY (Modifying files)' : 'CHECK (Dry run)'}\n`);

if (!fs.existsSync(sourceDir)) {
  console.error(`❌ Source directory does not exist: ${sourceDir}`);
  process.exit(1);
}

if (!fs.existsSync(DEST_DIR)) {
  if (isApply) {
    fs.mkdirSync(DEST_DIR, { recursive: true });
  } else {
    console.log(`[DRY-RUN] Destination directory ${DEST_DIR} will be created.`);
  }
}

// 1. Discover all root HTML files in source
const sourceEntries = fs.readdirSync(sourceDir, { withFileTypes: true });
const sourceHtmlFiles = sourceEntries
  .filter(e => e.isFile() && e.name.endsWith('.html'))
  .map(e => e.name);

console.log(`🔍 Found ${sourceHtmlFiles.length} root HTML files in source.`);

// 2. Discover existing HTML files in destination to identify legacy/orphan files
const destEntries = fs.existsSync(DEST_DIR) ? fs.readdirSync(DEST_DIR, { withFileTypes: true }) : [];
const destHtmlFiles = destEntries
  .filter(e => e.isFile() && e.name.endsWith('.html'))
  .map(e => e.name);

const orphanHtmlFiles = destHtmlFiles.filter(name => !sourceHtmlFiles.includes(name));
if (orphanHtmlFiles.length > 0) {
  console.log(`🗑️  Detected ${orphanHtmlFiles.length} legacy/orphan HTML files in destination:`);
  for (const orphan of orphanHtmlFiles) {
    console.log(`   - ${orphan}`);
    if (isApply) {
      fs.unlinkSync(path.join(DEST_DIR, orphan));
      console.log(`     ✓ Removed ${orphan}`);
    }
  }
}

// 3. Helper to copy folder recursively
function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest) && isApply) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else if (entry.isFile()) {
      if (isApply) {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

// 4. Copy assets directory
const sourceAssetsDir = path.join(sourceDir, 'assets');
const destAssetsDir = path.join(DEST_DIR, 'assets');
if (fs.existsSync(sourceAssetsDir)) {
  console.log(`\n📁 Synchronizing assets directory...`);
  copyDirRecursive(sourceAssetsDir, destAssetsDir);
  console.log(`  ✓ Assets directory copied successfully.`);
}

// 5. Script tag injector for HTML files
function injectSharedTags(content, filename) {
  const isPublic = filename === 'login.html';
  const sharedNames = ['auth.js', 'cases.js', 'handoff.js', 'case-bar.js', 'pipe-buttons.js', 'case-inbox.js'];
  
  // 1) Remove any existing shared script tags
  let cleaned = content;
  for (const name of sharedNames) {
    const pattern = new RegExp(`[ \\t]*<script[^>]*src="[^"]*(?:${name.replace('.', '\\.')})(?:\\?[^"]*)?"[^>]*>\\s*<\\/script>[ \\t]*\\r?\\n?`, 'gi');
    cleaned = cleaned.replace(pattern, '');
  }

  // 2) Prepare HEAD block
  let headBlock = '';
  if (!isPublic) {
    headBlock += '<script src="../shared-assets/auth.js"></script>\n';
  }
  headBlock += '<script src="../cases.js"></script>';

  // 3) Insert HEAD block before first local script or before </head>
  let headIns = -1;
  const scriptMatch = /(<script[^>]*\ssrc="([^"]+)"[^>]*>)/gi;
  let match;
  while ((match = scriptMatch.exec(cleaned)) !== null) {
    const src = match[2];
    if (!src.startsWith('http:') && !src.startsWith('https:') && !src.startsWith('//')) {
      headIns = match.index;
      break;
    }
  }

  if (headIns === -1) {
    const headEndMatch = /<\/head>/i.exec(cleaned);
    headIns = headEndMatch ? headEndMatch.index : 0;
  }

  const prevNewline = cleaned.lastIndexOf('\n', headIns);
  const lineStart = prevNewline === -1 ? 0 : prevNewline + 1;
  const indent = cleaned.substring(lineStart, headIns);
  const indentedHeadBlock = headBlock.split('\n').map((line, idx) => (idx === 0 ? line : indent + line)).join('\n');

  let withHead = cleaned.substring(0, lineStart) + indentedHeadBlock + '\n' + cleaned.substring(lineStart);

  // 4) Prepare BODY block
  const bodyBlock = [
    '<script src="../shared-assets/handoff.js"></script>',
    '<script src="../shared-assets/case-bar.js"></script>',
    '<script src="../shared-assets/pipe-buttons.js"></script>',
    '<script src="../shared-assets/case-inbox.js"></script>'
  ].join('\n');

  // 5) Insert BODY block before the last </body>
  const bodyIns = withHead.toLowerCase().lastIndexOf('</body>');
  let finalHtml = '';
  if (bodyIns !== -1) {
    const bodyPrevNewline = withHead.lastIndexOf('\n', bodyIns);
    const bodyLineStart = bodyPrevNewline === -1 ? 0 : bodyPrevNewline + 1;
    const bodyIndent = withHead.substring(bodyLineStart, bodyIns);
    const indentedBodyBlock = bodyBlock.split('\n').map((line, idx) => (idx === 0 ? line : bodyIndent + line)).join('\n');
    finalHtml = withHead.substring(0, bodyLineStart) + indentedBodyBlock + '\n' + withHead.substring(bodyLineStart);
  } else {
    finalHtml = withHead + '\n' + bodyBlock + '\n';
  }

  return finalHtml;
}

// 6. Copy and inject HTML files
console.log(`\n📄 Processing and injecting shared tags for ${sourceHtmlFiles.length} HTML files...`);
let processedCount = 0;

for (const htmlFile of sourceHtmlFiles) {
  const srcFile = path.join(sourceDir, htmlFile);
  const destFile = path.join(DEST_DIR, htmlFile);
  const rawHtml = fs.readFileSync(srcFile, 'utf8');
  const transformedHtml = injectSharedTags(rawHtml, htmlFile);

  if (isApply) {
    fs.writeFileSync(destFile, transformedHtml, 'utf8');
  }
  processedCount++;
}

console.log(`  ✓ Successfully processed ${processedCount} HTML files.`);
console.log(`\n===============================================================`);
console.log(`🎉 Sync Complete! ${isApply ? '(Changes applied)' : '(Dry run finished, use --apply to commit)'}`);
console.log(`===============================================================\n`);
