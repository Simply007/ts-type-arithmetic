# Extreme TypeScript: Mastering Recursion and Inference via Type-Level Arithmetic

Type-level arithmetic operations (addition and multiplication) for TypeScript.

## Features

- **`Sum<A, B>`** - Type-level addition of two number literals
- **`Mul<A, B>`** - Type-level multiplication of two number literals
- Runtime functions with precise type inference

## Installation

```bash
npm install
```

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

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run type tests
npm run test:types

# Evaluate type expressions (shows computed values)
npm run inspect -- --eval "Sum<55,67>" "Mul<12,10>"
# Output:
# Sum<55,67> = 122
# Mul<12,10> = 120

# Inspect type aliases matching a pattern
npm run inspect -- src/arithmetic.ts --pattern "Sum|Mul"
```

## How It Works

The library uses TypeScript's template literal types and tuple manipulation to perform digit-by-digit arithmetic at the type level. This allows TypeScript to compute exact numeric literal types for addition and multiplication operations.

## Limitations

- Due to TypeScript's recursion limits, very large numbers may cause compilation errors
- Negative numbers are not supported
- Floating-point numbers are not supported

## License

MIT
