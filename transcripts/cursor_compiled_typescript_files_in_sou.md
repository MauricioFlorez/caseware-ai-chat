# Compiled TypeScript files in source directory
_Exported on 2/23/2026 at 15:23:03 GMT-5 from Cursor (2.5.20)_

---

**User**

Verify this issue exists and fix it:

Compiled TypeScript output (`.js`, `.d.ts`, `.js.map`, `.d.ts.map` files) is committed inside `shared/src/` alongside the `.ts` source files. The `shared/tsconfig.json` sets `"outDir": "dist"` and `shared/package.json` points `main` and `types` to `dist/`, so these `src/` artifacts are not used by consumers and appear to have been accidentally committed. They clutter the source directory and risk staleness relative to the actual `.ts` sources. @shared/src/index.js:1-2 @shared/src/types/stream-events.js:1-6 @shared/src/index.d.ts:1-2 

---

**Cursor**


Verifying compiled artifacts in `shared/src/` and removing them.



Confirming the issue: eight compiled artifacts are in `shared/src/` while tsconfig uses `outDir: "dist"` and package.json points to `dist/`. Deleting them and checking `.gitignore`.



Deleting the eight compiled files and adding gitignore rules so `shared/src/` build artifacts aren't committed again.



Adding gitignore rules so compiled artifacts in `shared/src/` aren't committed again:



Summary of what was done:

**Verified**
- **8 compiled artifacts** were in `shared/src/`: `index.js`, `index.js.map`, `index.d.ts`, `index.d.ts.map` and the same set for `types/stream-events`.
- `shared/tsconfig.json` has `"outDir": "dist"` and `"rootDir": "src"`.
- `shared/package.json` has `"main": "dist/index.js"` and `"types": "dist/index.d.ts"`.
- So build output is intended to go to `dist/` and consumers use `dist/`; the files under `src/` were leftover/accidental.

**Changes made**
1. **Removed** all 8 compiled files from `shared/src/` (and `shared/src/types/`).
2. **Updated `.gitignore`** with:
   - `shared/src/**/*.js`
   - `shared/src/**/*.d.ts`
   - `shared/src/**/*.js.map`
   - `shared/src/**/*.d.ts.map`  
   so any future build output under `shared/src/` is ignored.

`shared/src/` now only has the TypeScript sources (e.g. `index.ts`, `types/stream-events.ts`), and the canonical build output remains in `shared/dist/` as defined by tsconfig and package.json.

