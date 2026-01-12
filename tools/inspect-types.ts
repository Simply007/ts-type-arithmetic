import * as ts from 'typescript';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_FILE = path.resolve(__dirname, '../src/arithmetic.ts');
const DEFAULT_PATTERN = /^test/;

interface InspectOptions {
  file: string;
  pattern: RegExp;
  evalTypes: string[];
}

function parseArgs(): InspectOptions {
  const args = process.argv.slice(2);
  let file = DEFAULT_FILE;
  let pattern = DEFAULT_PATTERN;
  const evalTypes: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--pattern' || arg === '-p') {
      pattern = new RegExp(args[++i] || '');
    } else if (arg === '--eval' || arg === '-e') {
      // Collect all following arguments until next flag
      while (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        evalTypes.push(args[++i]);
      }
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else if (!arg.startsWith('-')) {
      file = path.resolve(arg);
    }
  }

  return { file, pattern, evalTypes };
}

function printHelp(): void {
  console.log(`
Usage: npx tsx tools/inspect-types.ts [file] [options]

Arguments:
  file                    TypeScript file to inspect (default: src/arithmetic.ts)

Options:
  -p, --pattern <regex>   Pattern to match type alias names (default: /^test/)
  -e, --eval <types...>   Evaluate type expressions and show computed values
  -h, --help              Show this help message

Examples:
  npx tsx tools/inspect-types.ts
  npx tsx tools/inspect-types.ts src/index.ts
  npx tsx tools/inspect-types.ts src/arithmetic.ts --pattern "^Sum|^Mul"
  npx tsx tools/inspect-types.ts --eval "Sum<55,67>" "Mul<12,10>"
`);
}

function inspectTypes({ file, pattern }: InspectOptions): void {
  const program = ts.createProgram([file], {
    skipLibCheck: true,
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
  });

  const checker = program.getTypeChecker();
  const source = program.getSourceFile(file);

  if (!source) {
    console.error(`Error: Could not load file "${file}"`);
    process.exit(1);
  }

  console.log(`Inspecting types in: ${file}`);
  console.log(`Pattern: ${pattern}`);
  console.log('---');

  let found = 0;

  source.forEachChild((node) => {
    if (ts.isTypeAliasDeclaration(node) && pattern.test(node.name.text)) {
      const type = checker.getTypeAtLocation(node.name);
      const typeString = checker.typeToString(type);
      console.log(`${node.name.text} = ${typeString}`);
      found++;
    }
  });

  if (found === 0) {
    console.log(`No type aliases found matching pattern: ${pattern}`);
  } else {
    console.log('---');
    console.log(`Found ${found} type alias(es)`);
  }
}

function evalTypes(evalExpressions: string[], sourceFile: string): void {
  // Build virtual source that imports types and creates type aliases for each expression
  const typeAliases = evalExpressions.map((expr, i) => `type _Eval${i} = ${expr};`).join('\n');
  const virtualSource = `
import { Sum, Mul, Digit, DigitToTupleMap, StrDigitToTuple, StrToTuple, SumStrDigits, ConcatStrings, SumTupleOfStrDigits, SumStringNumbers, StringToNumber } from '${sourceFile}';
${typeAliases}
`;

  const virtualFileName = '/virtual-eval.ts';

  // Create a custom compiler host that serves our virtual file
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

  const program = ts.createProgram([virtualFileName, sourceFile], {
    skipLibCheck: true,
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
  }, customHost);

  const checker = program.getTypeChecker();
  const source = program.getSourceFile(virtualFileName);

  if (!source) {
    console.error('Error: Could not create virtual file for evaluation');
    process.exit(1);
  }

  console.log('Evaluating types:');
  console.log('---');

  source.forEachChild((node) => {
    if (ts.isTypeAliasDeclaration(node) && node.name.text.startsWith('_Eval')) {
      const index = parseInt(node.name.text.replace('_Eval', ''), 10);
      const type = checker.getTypeAtLocation(node.name);
      const typeString = checker.typeToString(type);
      console.log(`${evalExpressions[index]} = ${typeString}`);
    }
  });
}

const options = parseArgs();

if (options.evalTypes.length > 0) {
  evalTypes(options.evalTypes, options.file);
} else {
  inspectTypes(options);
}
