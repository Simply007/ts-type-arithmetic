# TypeScript 5.9 → 7.0 Upgrade

## What changed

TypeScript 7.0 rewrites the compiler in Go, delivering roughly **8× faster** build times through native code execution and shared-memory parallelism. The package ships as `@typescript/native-preview` with a new `tsgo` binary alongside the standard `tsc`.

---

## Build-speed comparison

Measured on this project (type-level arithmetic library, `src/` + `learning/`, NodeNext ESM, strict mode).

### Type-check only (`--noEmit`)

| Run | `tsc` 5.9.3 | `tsgo` 7.0-dev |
|-----|------------|----------------|
| 1   | 0.60 s     | 0.07 s         |
| 2   | 0.29 s     | 0.03 s         |
| 3   | 0.28 s     | 0.04 s         |
| **avg (runs 2–3)** | **0.285 s** | **0.035 s** |

**~8× faster** (steady state, excluding cold-start JIT of Node.js on run 1)

### Full build (emit `.js` + `.d.ts` + source maps)

| Run | `tsc` 5.9.3 | `tsgo` 7.0-dev |
|-----|------------|----------------|
| 1   | 0.35 s     | 0.05 s         |
| 2   | 0.33 s     | 0.04 s         |
| 3   | 0.32 s     | 0.04 s         |
| **avg** | **0.333 s** | **0.043 s** |

**~7.7× faster**

> Measured with `/usr/bin/time -p` on macOS (Darwin 24.6.0, Apple Silicon). Both runs use a cold `dist/` (deleted before each measurement). The first `tsc` run is slower due to Node.js JIT warm-up; subsequent runs are representative.

---

## Code changes required

### `src/index.ts` — remove unused Node import

```diff
-import { SourceMap } from 'node:module';
```

This import was never used. In TS 7.0 the `types` tsconfig option defaults to `[]` (previously all installed `@types/*` packages were auto-included), so `@types/node` is no longer implicitly available. Removing the dead import is the correct fix.

### `package.json` — TypeScript version and build command

```diff
-    "build": "tsc",
+    "build": "tsgo",
```

```diff
-    "typescript": "^5.3.0",
+    "typescript": "npm:@typescript/native-preview@^7.0.0-dev.20260421.2",
+    "typescript-api": "npm:typescript@^5.9",
```

`typescript-api` is a separate alias kept for `tools/inspect-types.ts` and `tools/benchmark-sum.ts`, which rely on the TypeScript programmatic (JS) API. The native-preview package only ships the `tsgo` binary — it has no JS library exports. The stable programmatic API for TS 7 is planned for 7.1.

### `tools/inspect-types.ts` & `tools/benchmark-sum.ts`

```diff
-import * as ts from 'typescript';
+import * as ts from 'typescript-api';
```

### `tsconfig.json` — no changes needed

All existing settings remain valid in TS 7.0:

| Option | Value | Status |
|--------|-------|--------|
| `module` | `NodeNext` | ✓ still supported |
| `moduleResolution` | `NodeNext` | ✓ still supported |
| `strict` | `true` | ✓ unchanged |
| `esModuleInterop` | `true` | ✓ (cannot be `false` in 7.0, was already `true`) |
| `target` | `ES2020` | ✓ still supported |
| `rootDir` | `"src"` | ✓ explicit — not affected by new default of `"./"` |

---

## TS 7.0 breaking changes that do NOT affect this project

| Change | Why it doesn't apply |
|--------|----------------------|
| `module: amd/umd/systemjs/none` removed | Uses `NodeNext` |
| `moduleResolution: node10/classic` removed | Uses `NodeNext` |
| `target: es5` removed | Uses `ES2020` |
| `baseUrl` removed | Not used |
| `alwaysStrict` must be `true` | Covered by `strict: true` |
| `noUncheckedSideEffectImports: true` default | No bare side-effect imports in codebase |
| `stableTypeOrdering: true` | Affects type display order only, not type semantics |

---

## Known limitation: tools use TS 5.9 programmatic API

`npm run inspect`, `npm run inspect:sum`, and `npm run benchmark` invoke the TypeScript compiler API to evaluate types at runtime. These scripts continue to use `typescript-api` (TS 5.9.3) because TS 7.0 does not yet expose a stable JS programmatic API. The printed `TypeScript version: 5.9.3` in benchmark output is expected.

This limitation is temporary — the TS team plans to ship a stable programmatic API in TypeScript 7.1.
