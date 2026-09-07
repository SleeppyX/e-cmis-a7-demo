# Plan: Migration & Sync of Activity 7 into ecmis Monorepo

**Date:** 2026-09-04  
**Author:** Antigravity (Gemini)  
**Status:** Completed  
**Source Repository:** `D:\Samart-W\กจ.7\e-cmis demo\e-cmis-a7-demo`  
**Destination Repository:** `D:\Samart-W\กจ.7\ecmis` (Directory: `board-resolution/`)

---

## 1. Background & Objectives
Following ongoing development in `e-cmis-a7-demo` on 2026-09-04 (specifically introducing the `case_admin` role for กองบริหารคดี, new pages `case-admin-inbox.html`, `case-admin-detail.html`, `notifications.html`, screening read-only lock, and notification redirect loop fixes), these changes needed to be synchronized into the central monorepo `ecmis` while maintaining full portal integration.

---

## 2. Key Decisions (Grill-me Protocol)
1. **Periodic Sync via Automation:** Keep `e-cmis-a7-demo` as the standalone development repository for Activity 7 and sync into `ecmis/board-resolution` via the automated sync engine.
2. **Full Hub Integration:**
   - Add user `Napat.S` (`case_admin`) to `shared-assets/auth.js` in `ecmis`.
   - Update `actEntry` routing in `auth.js` to route `case_admin` directly to `board-resolution/case-admin-inbox.html`.
   - Add seed case `0415/2569` in `cases.js` for `case_admin` queue testing.
3. **Bug Fixes in Sync Engines:**
   - Resolve `</body>` matching bug in `ecmis/board-resolution/scripts/sync-board-resolution.mjs`: previously matched first `</body>` which occurred inside the client-side Word export string template in `case-register.html` and `register.html`. Fixed to `lastIndexOf('</body>')`.
   - Resolve destructive route aliases in `e-cmis-a7-demo/scripts/migrate-to-ecmis.js` which previously overwrote distinct pages (`order.html`, `resolution.html`, `agenda.html`, `review.html`).
4. **Git Strategy:**
   - In `ecmis`: Clean local dirty changes (`git restore`), pull origin commits (`git pull origin main`), branch `activity-7`, commit changes (`94885f1`), and fast-forward merge into `main`.
5. **Cross-Platform Compatibility:**
   - Fixed Windows URL path bug in `ecmis/tests/seam-logic.test.mjs` using `fileURLToPath(new URL('..', import.meta.url))`.

---

## 3. Verification & Test Results
1. `node scripts/test-system.js` in `ecmis`:
   - Secret & Credential Leak Scanner: Passed (0 leaks in 400 files).
   - JavaScript Syntax Compilation Check: Passed (98 JS files clean).
   - Central Auth & User Registry Verification: Passed (All 25 user accounts authenticated).
   - Verification of All 10 Activity Modules: Passed.
   - **Overall Status: 100% Passed**.
2. `node tests/seam-logic.test.mjs` in `ecmis`:
   - Activity 7 bridge and scoped isolation verified.
3. `npm test` in `e-cmis-a7-demo`:
   - All 5 layers passed (37 paired HTML routes, 260 internal links verified, zero 404s).

---

## 4. Boundary Enforcement & External Files Revert (2026-09-07)
Following project policy that Activity 7 must strictly confine all code changes within `board-resolution/`, modifications to external files (`cases.js`, `shared-assets/auth.js`, and `tests/seam-logic.test.mjs`) were reverted:
1. **Reverted to Base:** `git checkout c99cec8 -- cases.js shared-assets/auth.js tests/seam-logic.test.mjs`
2. **Commit & Push:** Created commit `291cc78` (`fix(repo): restore files outside board-resolution to preserve module boundaries`) on `main` and pushed to `origin/main`.
3. **Module Independence:** Role `case_admin` remains fully functional and accessible via `board-resolution/login.html` and internal mock stores in `board-resolution/assets/ecmis-app.js`.
4. **Verification:** `node scripts/test-system.js` passed 100% (24 accounts, 10 modules), and `git diff c99cec8..HEAD --stat` verified that 100% of diffs are within `board-resolution/`.
