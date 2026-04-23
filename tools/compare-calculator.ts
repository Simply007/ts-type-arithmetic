/**
 * Compares the plain-JS calculator against the type-level calculator across two axes:
 *   1. Compile-time  — how long the TS checker needs to resolve each approach
 *   2. Runtime       — actual execution speed (both collapse to identical arithmetic)
 */
import * as ts from 'typescript-api';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SOURCE_FILE = path.resolve(__dirname, '../src/arithmetic.ts');

// ─────────────────────────────────────────────────────────────
// Compile-time helpers
// Each helper creates ONE program with N type aliases so the
// startup cost is shared and the type-resolution overhead is
// visible across the batch.
// ─────────────────────────────────────────────────────────────

const COMPILER_OPTS: ts.CompilerOptions = {
  skipLibCheck: true,
  target: ts.ScriptTarget.ES2020,
  module: ts.ModuleKind.NodeNext,
  moduleResolution: ts.ModuleResolutionKind.NodeNext,
};

function makeHost(virtualFileName: string, virtualSource: string): ts.CompilerHost {
  const defaultHost = ts.createCompilerHost({});
  return {
    ...defaultHost,
    getSourceFile: (f, v) =>
      f === virtualFileName
        ? ts.createSourceFile(f, virtualSource, v, true)
        : defaultHost.getSourceFile(f, v),
    fileExists: (f) => f === virtualFileName || defaultHost.fileExists(f),
    readFile: (f) => (f === virtualFileName ? virtualSource : defaultHost.readFile(f)),
  };
}

// One program with N type-level aliases — returns total ms
function evalTypeBatch(expressions: string[]): number {
  const aliases = expressions.map((e, i) => `type _R${i} = ${e};`).join('\n');
  const src = `import { Sum, Mul } from '${SOURCE_FILE}';\n${aliases}`;
  const fname = '/batch-typed.ts';
  const start = performance.now();
  const prog = ts.createProgram([fname, SOURCE_FILE], COMPILER_OPTS, makeHost(fname, src));
  prog.getTypeChecker();
  return performance.now() - start;
}

// One program with N plain const declarations — returns total ms
function evalPlainBatch(expressions: string[]): number {
  const decls = expressions.map((e, i) => `const _r${i} = ${e};`).join('\n');
  const fname = '/batch-plain.ts';
  const start = performance.now();
  const prog = ts.createProgram([fname], COMPILER_OPTS, makeHost(fname, decls));
  prog.getTypeChecker();
  return performance.now() - start;
}

// ─────────────────────────────────────────────────────────────
// Runtime helpers (tight loops, JIT-warmed)
// ─────────────────────────────────────────────────────────────

const ITERATIONS = 50_000_000;

function measureRuntime(fn: () => number): number {
  const start = performance.now();
  let sink = 0;
  for (let i = 0; i < ITERATIONS; i++) sink = fn();
  void sink;
  return (performance.now() - start) / ITERATIONS * 1e6; // ns/op
}

// ─────────────────────────────────────────────────────────────
// Section 1: Compile-time overhead
// ─────────────────────────────────────────────────────────────

function compileTimeSection(): void {
  console.log('='.repeat(62));
  console.log('SECTION 1 — Compile-time type-checking overhead');
  console.log('Strategy: batch N expressions per program so startup cost is');
  console.log('shared and per-expression resolution cost becomes visible.');
  console.log('='.repeat(62));
  console.log();

  // Batches of increasing size — plain arithmetic vs Sum/Mul type aliases
  const addBatches: { n: number; plain: string[]; typed: string[] }[] = [
    { n: 1,   plain: ['1 + 2'],                             typed: ['Sum<1, 2>'] },
    { n: 5,   plain: ['1+2','3+4','5+6','55+67','256+346'], typed: ['Sum<1,2>','Sum<3,4>','Sum<5,6>','Sum<55,67>','Sum<256,346>'] },
    { n: 10,  plain: Array.from({length:10},(_,i)=>`${i*11+1} + ${i*13+2}`),
              typed: Array.from({length:10},(_,i)=>`Sum<${i*11+1}, ${i*13+2}>`) },
    { n: 20,  plain: Array.from({length:20},(_,i)=>`${i*17+1} + ${i*19+3}`),
              typed: Array.from({length:20},(_,i)=>`Sum<${i*17+1}, ${i*19+3}>`) },
  ];

  const mulBatches: { n: number; plain: string[]; typed: string[] }[] = [
    { n: 1,   plain: ['2 * 3'],                              typed: ['Mul<2, 3>'] },
    { n: 5,   plain: ['2*3','5*7','10*10','32*47','50*20'],  typed: ['Mul<2,3>','Mul<5,7>','Mul<10,10>','Mul<32,47>','Mul<50,20>'] },
    { n: 10,  plain: Array.from({length:10},(_,i)=>`${i*3+2} * ${i*4+3}`),
              typed: Array.from({length:10},(_,i)=>`Mul<${i*3+2}, ${i*4+3}>`) },
  ];

  const colN    = 6;
  const colTime = 14;

  console.log('  Addition (Sum<A,B>)');
  console.log('  ' + 'N'.padEnd(colN) + 'Plain JS batch'.padEnd(colTime) + 'Type-level batch'.padEnd(colTime) + 'Per-type overhead');
  console.log('  ' + '-'.repeat(colN + colTime * 2 + 18));

  for (const { n, plain, typed } of addBatches) {
    const plainMs = evalPlainBatch(plain);
    const typedMs = evalTypeBatch(typed);
    const overhead = typedMs - plainMs;
    const perType  = overhead / n;
    console.log(
      '  ' + String(n).padEnd(colN) +
      `${plainMs.toFixed(1)}ms`.padEnd(colTime) +
      `${typedMs.toFixed(1)}ms`.padEnd(colTime) +
      `+${overhead.toFixed(1)}ms total  (+${perType.toFixed(1)}ms/type)`
    );
  }

  console.log();
  console.log('  Multiplication (Mul<A,B>)');
  console.log('  ' + 'N'.padEnd(colN) + 'Plain JS batch'.padEnd(colTime) + 'Type-level batch'.padEnd(colTime) + 'Per-type overhead');
  console.log('  ' + '-'.repeat(colN + colTime * 2 + 18));

  for (const { n, plain, typed } of mulBatches) {
    const plainMs = evalPlainBatch(plain);
    const typedMs = evalTypeBatch(typed);
    const overhead = typedMs - plainMs;
    const perType  = overhead / n;
    console.log(
      '  ' + String(n).padEnd(colN) +
      `${plainMs.toFixed(1)}ms`.padEnd(colTime) +
      `${typedMs.toFixed(1)}ms`.padEnd(colTime) +
      `+${overhead.toFixed(1)}ms total  (+${perType.toFixed(1)}ms/type)`
    );
  }

  console.log();
  console.log('Plain batch time ≈ compiler startup + trivial number widening.');
  console.log('Type-level overhead = recursive conditional-type resolution per alias.');
  console.log('Paid once at build time — zero cost at runtime.');
}

// ─────────────────────────────────────────────────────────────
// Section 2: Runtime execution
// ─────────────────────────────────────────────────────────────

function runtimeSection(): void {
  console.log();
  console.log('='.repeat(62));
  console.log('SECTION 2 — Runtime execution speed');
  console.log('Both approaches compile to identical machine instructions.');
  console.log(`(${ITERATIONS.toLocaleString()} iterations each, reporting ns/op)`);
  console.log('='.repeat(62));
  console.log();

  const cases: { op: string; a: number; b: number; isAdd: boolean }[] = [
    { op: 'add(2, 3)',         a: 2,     b: 3,   isAdd: true  },
    { op: 'add(55, 67)',       a: 55,    b: 67,  isAdd: true  },
    { op: 'add(1234, 5678)',   a: 1234,  b: 5678,isAdd: true  },
    { op: 'mul(2, 3)',         a: 2,     b: 3,   isAdd: false },
    { op: 'mul(32, 47)',       a: 32,    b: 47,  isAdd: false },
    { op: 'mul(220, 12)',      a: 220,   b: 12,  isAdd: false },
  ];

  const colOp = 22;
  const colT  = 14;
  console.log(
    'Operation'.padEnd(colOp) +
    'Plain JS (ns/op)'.padEnd(colT) +
    'Type-level (ns/op)'.padEnd(colT) +
    'Diff'
  );
  console.log('-'.repeat(colOp + colT * 2 + 6));

  for (const { op, a, b, isAdd } of cases) {
    // Plain JS calculator
    const plainNs = isAdd
      ? measureRuntime(() => a + b)
      : measureRuntime(() => a * b);

    // Type-level compiled output: `as` cast is erased at compile time,
    // leaving the same bare arithmetic instruction.
    const typedNs = isAdd
      ? measureRuntime(() => (a + b) as number)
      : measureRuntime(() => (a * b) as number);

    const diff = typedNs - plainNs;
    const diffStr = Math.abs(diff) < 0.01 ? '≈ 0' : `${diff > 0 ? '+' : ''}${diff.toFixed(3)}`;

    console.log(
      op.padEnd(colOp) +
      `${plainNs.toFixed(3)}`.padEnd(colT) +
      `${typedNs.toFixed(3)}`.padEnd(colT) +
      diffStr
    );
  }

  console.log();
  console.log('TypeScript `as` casts carry zero runtime cost — the emitted JS is identical.');
  console.log('Any visible diff is measurement noise from JIT scheduling, not real overhead.');
}

// ─────────────────────────────────────────────────────────────
// Section 3: What you get for the compile-time cost
// ─────────────────────────────────────────────────────────────

function tradeoffSection(): void {
  console.log();
  console.log('='.repeat(62));
  console.log('SECTION 3 — What the compile-time cost buys you');
  console.log('='.repeat(62));
  console.log();

  const virtualSource = `
import { Sum, Mul } from '${SOURCE_FILE}';
type AddResult  = Sum<1234, 5678>;   // 6912  — exact literal, not 'number'
type MulResult  = Mul<32, 47>;       // 1504  — exact literal, not 'number'
type BadAssign  = Sum<1, 1> extends 3 ? true : false;  // false — caught at compile time
`;
  const virtualFileName = '/demo.ts';
  const defaultHost = ts.createCompilerHost({});
  const customHost: ts.CompilerHost = {
    ...defaultHost,
    getSourceFile: (f, v) =>
      f === virtualFileName
        ? ts.createSourceFile(f, virtualSource, v, true)
        : defaultHost.getSourceFile(f, v),
    fileExists: (f) => f === virtualFileName || defaultHost.fileExists(f),
    readFile: (f) => (f === virtualFileName ? virtualSource : defaultHost.readFile(f)),
  };
  const program = ts.createProgram([virtualFileName, SOURCE_FILE], {
    skipLibCheck: true,
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
  }, customHost);
  const checker = program.getTypeChecker();
  const source  = program.getSourceFile(virtualFileName)!;

  source.forEachChild((node) => {
    if (ts.isTypeAliasDeclaration(node)) {
      const type = checker.typeToString(checker.getTypeAtLocation(node.name));
      console.log(`  type ${node.name.text.padEnd(12)} = ${type}`);
    }
  });

  console.log();
  console.log('Plain JS `a + b` always widens to `number`.');
  console.log('Type-level Sum<A,B> preserves the exact literal — IDE, inference, and');
  console.log('downstream type constraints all see the precise computed value.');
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

console.log('Calculator comparison: Plain JS vs Type-Level (TypeScript ' + ts.version + ')');
console.log();
compileTimeSection();
runtimeSection();
tradeoffSection();
