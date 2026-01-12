# Extreme TypeScript: Mastering Recursion and Inference via Type-Level Arithmetic

Learn advanced TypeScript type system features by building a compile-time calculator, step by step.

## What You'll Learn

This repository teaches you how to leverage TypeScript's type system to perform arithmetic **at compile time**. By the end, you'll understand:

- Conditional types and pattern matching
- The `infer` keyword for type extraction
- Template literal types for string manipulation
- Tuple types and the spread operator
- Recursive type definitions
- How to combine these features into powerful type-level programs

## Learning Path

The `learning/` directory guides you through the concepts progressively:

### Step 0: Building Blocks

📚 **[00-BUILDING_BLOCS.md](./learning/00-BUILDING_BLOCS.md)** - Start here!

Covers the fundamental TypeScript features with links to official documentation:
- Conditional Types (`T extends U ? X : Y`)
- The `infer` Keyword
- Template Literal Types
- Tuple Types and Spread
- Indexed Access Types

### Step 1: Single Digit Addition

📄 **[01-arithmetic-digits.ts](./learning/01-arithmetic-digits.ts)**

The simplest implementation - adds two single digits (0-9) using the "tuple length" trick:

```typescript
type SimpleSum<A extends Digit, B extends Digit> =
  [...DigitToTuple[A], ...DigitToTuple[B]]['length'];

type Result = SimpleSum<3, 5>;  // 8
```

### Step 2: Multi-Digit Without Carry

📄 **[02-arithmetic-no-carry.ts](./learning/02-arithmetic-no-carry.ts)**

Introduces right-to-left processing with an accumulator, but no carry handling:

```typescript
type Result = Sum<12, 34>;  // 46 ✓
type Broken = Sum<19, 11>;  // "210" ✗ (demonstrates why carry is needed)
```

### Step 3: Full Implementation Walkthrough

📚 **[03-WALKTHROUGH.md](./learning/03-WALKTHROUGH.md)**

Complete state-by-state walkthrough of the full algorithm, covering all 6 possible states with detailed examples.

### Final: Complete Implementation

📄 **[src/arithmetic.ts](./src/arithmetic.ts)**

The full implementation with carry handling:

```typescript
type Result1 = Sum<55, 67>;    // 122
type Result2 = Sum<999, 1>;    // 1000
type Result3 = Mul<12, 10>;    // 120
```

## Quick Start

```bash
# Install dependencies
npm install

# Explore type evaluations interactively
npm run inspect -- --eval "Sum<55, 67>" "Mul<12, 10>"
# Output:
# Sum<55, 67> = 122
# Mul<12, 10> = 120

# Inspect types in a specific file
npm run inspect -- learning/01-arithmetic-digits.ts --pattern "^test"

# Run type tests
npm run test:types

# Build
npm run build
```

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript to JavaScript (outputs to `dist/`) |
| `npm run clean` | Remove the `dist/` directory |
| `npm run test:types` | Run type tests using [tsd](https://github.com/tsdjs/tsd) |
| `npm run inspect` | Interactive type inspector tool (`npm run inspect -- --help` for all options) |
| `npm run inspect:sum` | Quick example: inspect `Sum<1234, 5678>` |
| `npm run benchmark` | Run performance benchmarks and find recursion limits |

### Inspect Tool Examples

```bash
# Evaluate type expressions directly
npm run inspect -- --eval "Sum<55, 67>" "Mul<12, 10>"

# Inspect all exported types in a file
npm run inspect -- learning/01-arithmetic-digits.ts

# Filter types by pattern (regex)
npm run inspect -- learning/01-arithmetic-digits.ts --pattern "^test"

# Combine file inspection with additional expressions
npm run inspect -- src/arithmetic.ts --eval "Sum<999, 1>"
```

### Benchmark

The benchmark tool compares type-level arithmetic against JavaScript runtime and discovers recursion limits:

- **Speed comparison**: Measures type-level `Sum` evaluation time vs JavaScript `+` operator
- **Sum recursion limit**: `Sum` uses digit-by-digit processing, so it can handle very large numbers (tested up to 1 billion)
- **Mul recursion limit**: `Mul<A, B>` recurses `A` times, so the first operand determines the limit (~500-1000 depending on TypeScript version)

## Usage

### Type-level operations

```typescript
import type { Sum, Mul } from 'ts-type-arithmetic';

type Result1 = Sum<55, 67>;    // 122
type Result2 = Mul<12, 10>;    // 120
type Result3 = Sum<256, 1546>; // 1802
```

### Runtime functions with type inference

```typescript
import { add, mul } from 'ts-type-arithmetic';

const sum = add(54, 382);    // Type: 436
const product = mul(32, 47); // Type: 1504
```

## Repository Structure

```plain
├── learning/                    # Step-by-step learning materials
│   ├── 00-BUILDING_BLOCS.md    # TypeScript building blocks (start here!)
│   ├── 01-arithmetic-digits.ts  # Single digit addition
│   ├── 02-arithmetic-no-carry.ts# Multi-digit without carry
│   └── 03-WALKTHROUGH.md        # Full algorithm walkthrough
├── src/
│   ├── arithmetic.ts            # Full implementation
│   └── index.ts                 # Public API
└── test-d/                      # Type tests
```

## Limitations

- Due to TypeScript's recursion limits, very large numbers may cause compilation errors
- Negative numbers are not supported
- Floating-point numbers are not supported

## License

MIT
