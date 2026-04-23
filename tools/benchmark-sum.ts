import * as ts from 'typescript-api';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_FILE = path.resolve(__dirname, '../src/arithmetic.ts');

interface BenchmarkResult {
  expression: string;
  expected: number;
  actual: string;
  success: boolean;
  timeMs: number;
}

function evalType(expression: string): { result: string; timeMs: number } {
  const virtualSource = `
import { Sum, Mul } from '${SOURCE_FILE}';
type _Result = ${expression};
`;

  const virtualFileName = '/virtual-benchmark.ts';

  const defaultHost = ts.createCompilerHost({});
  const customHost: ts.CompilerHost = {
    ...defaultHost,
    getSourceFile: (fileName, languageVersion) => {
      if (fileName === virtualFileName) {
        return ts.createSourceFile(fileName, virtualSource, languageVersion, true);
      }
      return defaultHost.getSourceFile(fileName, languageVersion);
    },
    fileExists: (fileName) => {
      if (fileName === virtualFileName) return true;
      return defaultHost.fileExists(fileName);
    },
    readFile: (fileName) => {
      if (fileName === virtualFileName) return virtualSource;
      return defaultHost.readFile(fileName);
    },
  };

  const start = performance.now();

  const program = ts.createProgram([virtualFileName, SOURCE_FILE], {
    skipLibCheck: true,
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
  }, customHost);

  const checker = program.getTypeChecker();
  const source = program.getSourceFile(virtualFileName);

  let result = 'error';

  if (source) {
    source.forEachChild((node) => {
      if (ts.isTypeAliasDeclaration(node) && node.name.text === '_Result') {
        const type = checker.getTypeAtLocation(node.name);
        result = checker.typeToString(type);
      }
    });
  }

  const timeMs = performance.now() - start;

  return { result, timeMs };
}

function benchmark(a: number, b: number): BenchmarkResult {
  const expression = `Sum<${a}, ${b}>`;
  const expected = a + b;

  const { result, timeMs } = evalType(expression);

  const actualNum = parseInt(result, 10);
  const success = !isNaN(actualNum) && actualNum === expected;

  return {
    expression,
    expected,
    actual: result,
    success,
    timeMs,
  };
}

function findRecursionLimit(): void {
  console.log('='.repeat(60));
  console.log('Finding Sum<N, N> recursion limit...');
  console.log('='.repeat(60));
  console.log();

  // Test progressively larger numbers
  // Since Sum uses digit-by-digit addition, recursion depth is O(digits), not O(value)
  // So we can test much larger numbers
  const testValues = [
    1, 10, 100, 1000, 10000, 100000, 1000000,
    10000000, 100000000, 1000000000
  ];

  let lastSuccess = 0;
  let firstFailure = 0;

  for (const n of testValues) {
    const result = benchmark(n, n);
    const status = result.success ? '✓' : '✗';
    const truncatedActual = result.actual.length > 30
      ? result.actual.substring(0, 30) + '...'
      : result.actual;

    console.log(
      `${status} Sum<${n}, ${n}> = ${truncatedActual.padEnd(35)} ` +
      `(expected: ${result.expected}, time: ${result.timeMs.toFixed(1)}ms)`
    );

    if (result.success) {
      lastSuccess = n;
    } else if (firstFailure === 0) {
      firstFailure = n;
    }

    // Stop if we've found a failure and confirmed the limit
    if (firstFailure > 0 && n > firstFailure * 2) {
      break;
    }
  }

  console.log();
  console.log('-'.repeat(60));
  console.log(`Last successful Sum<N, N>: N = ${lastSuccess} (result: ${lastSuccess * 2})`);
  console.log(`First failure at: N = ${firstFailure}`);

  // Binary search for exact limit
  if (lastSuccess > 0 && firstFailure > 0) {
    console.log();
    console.log('Binary searching for exact limit...');

    let low = lastSuccess;
    let high = firstFailure;

    while (high - low > 1) {
      const mid = Math.floor((low + high) / 2);
      const result = benchmark(mid, mid);

      if (result.success) {
        low = mid;
        console.log(`  ✓ Sum<${mid}, ${mid}> = ${result.expected}`);
      } else {
        high = mid;
        console.log(`  ✗ Sum<${mid}, ${mid}> failed`);
      }
    }

    console.log();
    console.log('='.repeat(60));
    console.log(`EXACT LIMIT: Sum<${low}, ${low}> = ${low * 2} works`);
    console.log(`             Sum<${high}, ${high}> fails`);
    console.log('='.repeat(60));
  }
}

function runSpeedBenchmark(): void {
  console.log();
  console.log('='.repeat(60));
  console.log('Speed benchmark for various Sum operations');
  console.log('='.repeat(60));
  console.log();

  const testCases: [number, number][] = [
    [2, 3],
    [12, 34],
    [55, 67],
    [99, 1],
    [195, 86],
    [256, 346],
    [500, 500],
    [999, 1],
    [100, 900],
  ];

  const results: BenchmarkResult[] = [];

  for (const [a, b] of testCases) {
    const result = benchmark(a, b);
    results.push(result);

    const status = result.success ? '✓' : '✗';
    console.log(
      `${status} ${result.expression.padEnd(20)} = ${result.actual.padEnd(10)} ` +
      `(${result.timeMs.toFixed(1)}ms)`
    );
  }

  const successfulResults = results.filter(r => r.success);
  if (successfulResults.length > 0) {
    const avgTime = successfulResults.reduce((sum, r) => sum + r.timeMs, 0) / successfulResults.length;
    console.log();
    console.log(`Average time: ${avgTime.toFixed(1)}ms`);
  }
}

function benchmarkMul(a: number, b: number): BenchmarkResult {
  const expression = `Mul<${a}, ${b}>`;
  const expected = a * b;

  const { result, timeMs } = evalType(expression);

  const actualNum = parseInt(result, 10);
  const success = !isNaN(actualNum) && actualNum === expected;

  return {
    expression,
    expected,
    actual: result,
    success,
    timeMs,
  };
}

function findMulRecursionLimit(): void {
  console.log();
  console.log('='.repeat(60));
  console.log('Finding Mul<N, M> recursion limit...');
  console.log('(Mul recurses N times, so limit depends on first operand)');
  console.log('='.repeat(60));
  console.log();

  // Mul<A, B> recurses A times (counter goes from 0 to A)
  // So the limit is based on the first operand
  const testValues = [
    1, 5, 10, 25, 50, 100, 200, 300, 400, 500,
    600, 700, 800, 900, 1000, 1500, 2000
  ];

  let lastSuccess = 0;
  let firstFailure = 0;

  for (const n of testValues) {
    const result = benchmarkMul(n, 10);
    const status = result.success ? '✓' : '✗';
    const truncatedActual = result.actual.length > 30
      ? result.actual.substring(0, 30) + '...'
      : result.actual;

    console.log(
      `${status} Mul<${n}, 10> = ${truncatedActual.padEnd(35)} ` +
      `(expected: ${result.expected}, time: ${result.timeMs.toFixed(1)}ms)`
    );

    if (result.success) {
      lastSuccess = n;
    } else if (firstFailure === 0) {
      firstFailure = n;
    }

    // Stop if we've found a failure
    if (firstFailure > 0) {
      break;
    }
  }

  console.log();
  console.log('-'.repeat(60));
  console.log(`Last successful Mul<N, 10>: N = ${lastSuccess} (result: ${lastSuccess * 10})`);
  if (firstFailure > 0) {
    console.log(`First failure at: N = ${firstFailure}`);

    // Binary search for exact limit
    console.log();
    console.log('Binary searching for exact limit...');

    let low = lastSuccess;
    let high = firstFailure;

    while (high - low > 1) {
      const mid = Math.floor((low + high) / 2);
      const result = benchmarkMul(mid, 10);

      if (result.success) {
        low = mid;
        console.log(`  ✓ Mul<${mid}, 10> = ${result.expected}`);
      } else {
        high = mid;
        console.log(`  ✗ Mul<${mid}, 10> failed`);
      }
    }

    console.log();
    console.log('='.repeat(60));
    console.log(`EXACT MUL LIMIT: Mul<${low}, 10> = ${low * 10} works`);
    console.log(`                 Mul<${high}, 10> fails`);
    console.log('='.repeat(60));
  } else {
    console.log('No failure found in tested range!');
  }
}

function runMulSpeedBenchmark(): void {
  console.log();
  console.log('='.repeat(60));
  console.log('Speed benchmark for Mul operations');
  console.log('='.repeat(60));
  console.log();

  const testCases: [number, number][] = [
    [2, 3],
    [10, 10],
    [32, 47],
    [50, 20],
    [100, 5],
    [220, 12],
  ];

  for (const [a, b] of testCases) {
    const result = benchmarkMul(a, b);
    const status = result.success ? '✓' : '✗';
    console.log(
      `${status} ${result.expression.padEnd(20)} = ${result.actual.padEnd(10)} ` +
      `(${result.timeMs.toFixed(1)}ms)`
    );
  }
}

function compareWithJavaScript(): void {
  console.log();
  console.log('='.repeat(60));
  console.log('Comparison: Type-Level Sum vs JavaScript Runtime');
  console.log('='.repeat(60));
  console.log();

  const testCases: [number, number][] = [
    [2, 3],
    [55, 67],
    [256, 346],
    [1000, 2000],
    [12345, 67890],
    [1000000, 2000000],
  ];

  console.log('| Operation'.padEnd(30) + '| Type-Level'.padEnd(15) + '| JavaScript'.padEnd(15) + '| Ratio'.padEnd(12) + '|');
  console.log('|' + '-'.repeat(29) + '|' + '-'.repeat(14) + '|' + '-'.repeat(14) + '|' + '-'.repeat(11) + '|');

  for (const [a, b] of testCases) {
    // Type-level benchmark
    const typeResult = benchmark(a, b);

    // JavaScript runtime benchmark (run many iterations for measurable time)
    const iterations = 1000000;
    const jsStart = performance.now();
    let jsResult = 0;
    for (let i = 0; i < iterations; i++) {
      jsResult = a + b;
    }
    const jsTimeMs = performance.now() - jsStart;
    const jsTimePerOp = jsTimeMs / iterations;

    const ratio = typeResult.timeMs / jsTimePerOp;

    const op = `Sum<${a}, ${b}>`.padEnd(28);
    const typeTime = `${typeResult.timeMs.toFixed(1)}ms`.padEnd(13);
    const jsTime = `${(jsTimePerOp * 1000).toFixed(3)}µs`.padEnd(13);
    const ratioStr = `${(ratio / 1000).toFixed(0)}k×`.padEnd(10);

    console.log(`| ${op}| ${typeTime}| ${jsTime}| ${ratioStr}|`);
  }

  console.log();
  console.log('Note: Type-level computation happens at compile time (once),');
  console.log('      JavaScript runs at runtime (every execution).');
  console.log();
  console.log('The type-level approach gives you:');
  console.log('  ✓ Compile-time type safety (catch errors before runtime)');
  console.log('  ✓ Zero runtime cost (result is a literal type)');
  console.log('  ✓ IDE autocompletion with exact numeric types');
}

// Main
console.log('TypeScript Type-Level Arithmetic Benchmark');
console.log(`TypeScript version: ${ts.version}`);
console.log();

runSpeedBenchmark();
findRecursionLimit();

runMulSpeedBenchmark();
findMulRecursionLimit();

compareWithJavaScript();
