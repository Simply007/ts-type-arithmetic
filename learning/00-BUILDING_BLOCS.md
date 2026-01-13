# Type-Level Arithmetic: A Deep Dive

This document explains how TypeScript's type system can perform arithmetic at compile time. We'll build up from fundamental concepts to the full `Sum` implementation.

## Part 1: TypeScript Building Blocks

Before diving into the arithmetic types, let's understand the TypeScript features that make this possible.

### 1.1 Conditional Types

📚 [TypeScript Docs: Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)

Conditional types work like ternary expressions but for types:

```typescript
type IsString<T> = T extends string ? true : false;

type A = IsString<"hello">; // true
type B = IsString<42>; // false
```

The pattern `T extends U ? X : Y` means: "If T is assignable to U, resolve to X, otherwise Y."

### 1.2 The `infer` Keyword

📚 [TypeScript Docs: Inferring Within Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#inferring-within-conditional-types)

`infer` lets you extract parts of a type during pattern matching:

```typescript
type GetFirstElement<T> = T extends [infer First, ...any[]] ? First : never;

type A = GetFirstElement<[1, 2, 3]>; // 1
type B = GetFirstElement<["a", "b"]>; // "a"
```

It's like destructuring, but for types. The `infer First` declares a type variable that captures whatever matches that position.

### 1.3 Template Literal Types

📚 [TypeScript Docs: Template Literal Types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html)

TypeScript can manipulate string literal types:

```typescript
type Greeting = `Hello, ${"World"}`; // "Hello, World"

// Pattern matching with template literals
type ExtractName<T> = T extends `Hello, ${infer Name}` ? Name : never;

type A = ExtractName<"Hello, Alice">; // "Alice"
type B = ExtractName<"Hi, Bob">; // never (doesn't match pattern)
```

### 1.4 Tuple Types and Spread

📚 [TypeScript Docs: Tuple Types](https://www.typescriptlang.org/docs/handbook/2/objects.html#tuple-types)
📚 [TypeScript Docs: Variadic Tuple Types](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-0.html#variadic-tuple-types)

Tuples are fixed-length arrays with known types at each position:

```typescript
type Point = [number, number]; // tuple of 2 numbers
type RGB = [number, number, number]; // tuple of 3 numbers
```

The spread operator works with tuples:

```typescript
type Combined = [...[1, 2], ...[3, 4]]; // [1, 2, 3, 4]
```

### 1.5 Indexed Access Types

📚 [TypeScript Docs: Indexed Access Types](https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html)

You can access properties of types using bracket notation:

```typescript
type Person = { name: string; age: number };
type Name = Person["name"]; // string

// Crucially for us - tuple length!
type Length = [0, 0, 0]["length"]; // 3
```

**This is the key insight**: A tuple's `"length"` property is a number literal type, not just `number`!

---

## Part 2: The Building Blocks of Type-Level Arithmetic

Now let's examine each helper type in our implementation.

### 2.1 `Digit` - Valid Single Digits

📚 [TypeScript Docs: Union Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types)

```typescript
type Digit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
```

A union type representing all valid single digits. Used to check if a sum needs a carry.

```bash
npm run inspect -- --eval "5 extends Digit ? true : false"
# true

npm run inspect -- --eval "12 extends Digit ? true : false"
# false (12 is not a single digit)
```

### 2.2 `DigitToTupleMap` - The Counting Foundation

📚 [TypeScript Docs: Object Types](https://www.typescriptlang.org/docs/handbook/2/objects.html)

```typescript
type DigitToTupleMap = {
  "0": [];
  "1": [0];
  "2": [0, 0];
  "3": [0, 0, 0];
  // ... up to '9'
  "9": [0, 0, 0, 0, 0, 0, 0, 0, 0];
};
```

This maps each digit (as a string) to a tuple of that length. The tuple contents don't matter - we only care about the length.

**Why strings?** Because we'll be parsing number strings character by character, and template literal matching gives us strings.

```bash
npm run inspect -- --eval "DigitToTupleMap['5']"
# [0, 0, 0, 0, 0]

npm run inspect -- --eval "DigitToTupleMap['5']['length']"
# 5
```

### 2.3 `StrDigitToTuple<T>` - Safe Lookup

📚 [TypeScript Docs: keyof Type Operator](https://www.typescriptlang.org/docs/handbook/2/keyof-types.html)

```typescript
type StrDigitToTuple<T extends string> = T extends keyof DigitToTupleMap
  ? DigitToTupleMap[T]
  : never;
```

**How it works:**

1. Check if `T` is a valid key in `DigitToTupleMap` (i.e., "0" through "9")
2. If yes, return the corresponding tuple
3. If no, return `never`

```bash
npm run inspect -- --eval 'StrDigitToTuple<"7">'
# [0, 0, 0, 0, 0, 0, 0]

npm run inspect -- --eval 'StrDigitToTuple<"x">'
# never
```

### 2.4 `StrToTuple<T>` - String to Character Array

📚 [TypeScript Docs: Recursive Conditional Types](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-1.html#recursive-conditional-types)

```typescript
type StrToTuple<
  T extends string,
  Accum extends readonly string[] = []
> = T extends `${infer Fst}${infer Rest}`
  ? StrToTuple<Rest, [...Accum, Fst]>
  : Accum;
```

This recursively splits a string into an array of characters.

**How it works:**

1. Pattern match: `T extends `${infer Fst}${infer Rest}\``
   - `Fst` captures the first character
   - `Rest` captures everything after
2. Recursively call with `Rest`, accumulating `Fst` into the result
3. When `T` is empty, the pattern fails, return the accumulated array

**Step-by-step for `"67"`:**

| Iteration | T    | Fst | Rest | Accum                 |
| --------- | ---- | --- | ---- | --------------------- |
| 1         | "67" | "6" | "7"  | ["6"]                 |
| 2         | "7"  | "7" | ""   | ["6", "7"]            |
| 3         | ""   | -   | -    | ["6", "7"] (returned) |

```bash
npm run inspect -- --eval 'StrToTuple<"67">'
# ["6", "7"]

npm run inspect -- --eval 'StrToTuple<"123">'
# ["1", "2", "3"]
```

### 2.5 `SumStrDigits<D1, D2, D3>` - The Core Addition Trick

📚 [TypeScript Docs: Variadic Tuple Types](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-0.html#variadic-tuple-types)

```typescript
type SumStrDigits<D1 extends string, D2 extends string, D3 extends string> = [
  ...StrDigitToTuple<D1>,
  ...StrDigitToTuple<D2>,
  ...StrDigitToTuple<D3>
]["length"];
```

**This is the heart of type-level addition!**

**How it works:**

1. Convert each digit string to a tuple of that length
2. Spread all tuples together into one big tuple
3. Get the length of the combined tuple

**Why three parameters?** The third is for the carry digit.

**Example: 5 + 7 + 0 (carry)**

```
StrDigitToTuple<"5"> = [0, 0, 0, 0, 0]           (length 5)
StrDigitToTuple<"7"> = [0, 0, 0, 0, 0, 0, 0]     (length 7)
StrDigitToTuple<"0"> = []                         (length 0)

Combined: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]   (length 12)
Result: 12
```

```bash
npm run inspect -- --eval 'SumStrDigits<"5", "7", "0">'
# 12

npm run inspect -- --eval 'SumStrDigits<"5", "6", "1">'
# 12 (5 + 6 + 1 carry)

npm run inspect -- --eval 'SumStrDigits<"2", "3", "0">'
# 5
```

### 2.6 `ConcatStrings<T>` - Array Back to String

📚 [TypeScript Docs: Template Literal Types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html)

```typescript
type ConcatStrings<
  T extends readonly string[],
  Accum extends string = ""
> = T extends [
  infer Fst extends string,
  ...infer TRest extends readonly string[]
]
  ? ConcatStrings<TRest, `${Accum}${Fst}`>
  : Accum;
```

The reverse of `StrToTuple` - joins an array of strings back into one string.

**How it works:**

1. Pattern match to extract first element and rest
2. Recursively call, appending first element to accumulator using template literal
3. When array is empty, return accumulator

```bash
npm run inspect -- --eval 'ConcatStrings<["6", "7"]>'
# "67"
```

### 2.7 `StringToNumber<T>` - String to Number Literal

📚 [TypeScript Docs: Template Literal Types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html)
📚 [TypeScript Docs: infer extends (TS 4.7)](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-7.html#extends-constraints-on-infer-type-variables)

```typescript
type StringToNumber<T extends string> = T extends `${infer Res extends number}`
  ? Res
  : never;
```

Converts a string like `"122"` to the number literal `122`.

**How it works:**

- Pattern matches with `infer Res extends number`
- TypeScript infers `Res` as a number literal type

```bash
npm run inspect -- --eval 'StringToNumber<"122">'
# 122

npm run inspect -- --eval 'StringToNumber<"abc">'
# never
```

### 2.8 `SumTupleOfStrDigits` - The Main Algorithm

See [# SumTupleOfStrDigits: Complete State Walkthrough](./03-WALKTHROUGH.md) for detailed explanation.

---

## Part 3: Examples

### Example 1: Simple (2 + 3 = 5)

```
Sum<2, 3>
→ StringToNumber<SumStringNumbers<"2", "3">>
→ StringToNumber<SumTupleOfStrDigits<["2"], ["3"]>>
```

**Iteration 1:**

- Num1 = ["2"], Num2 = ["3"], Carry = "0", Accum = ""
- Extract last digits: "2" and "3"
- SumStrDigits<"2", "3", "0"> = 5
- 5 extends Digit? Yes!
- Recurse: SumTupleOfStrDigits<[], [], "0", "5">

**Iteration 2:**

- Num1 = [], Num2 = [], Carry = "0", Accum = "5"
- Num1 is empty, Carry is "0"
- Return: `${ConcatStrings<[]>}${"5"}` = "5"

```
→ StringToNumber<"5">
→ 5
```

```bash
npm run inspect -- --eval 'SumTupleOfStrDigits<["2"], ["3"]>'
# "5"

npm run inspect -- --eval 'Sum<2, 3>'
# 5
```

### Example 2: Two Digits, No Carry (12 + 34 = 46)

```
Sum<12, 34>
→ SumTupleOfStrDigits<["1", "2"], ["3", "4"]>
```

**Iteration 1:**

- Num1 = ["1", "2"], Num2 = ["3", "4"], Carry = "0", Accum = ""
- Last digits: "2" and "4"
- SumStrDigits<"2", "4", "0"> = 6
- 6 extends Digit? Yes!
- Recurse: <["1"], ["3"], "0", "6">

**Iteration 2:**

- Num1 = ["1"], Num2 = ["3"], Carry = "0", Accum = "6"
- Last digits: "1" and "3"
- SumStrDigits<"1", "3", "0"> = 4
- 4 extends Digit? Yes!
- Recurse: <[], [], "0", "46">

**Iteration 3:**

- Num1 = [], Num2 = [], Carry = "0", Accum = "46"
- Return: "46"

```bash
npm run inspect -- --eval 'SumTupleOfStrDigits<["1", "2"], ["3", "4"]>'
# "46"

npm run inspect -- --eval 'Sum<12, 34>'
# 46
```

### Example 3: With Carry (55 + 67 = 122)

```
Sum<55, 67>
→ SumTupleOfStrDigits<["5", "5"], ["6", "7"]>
```

**Iteration 1:**

- Num1 = ["5", "5"], Num2 = ["6", "7"], Carry = "0", Accum = ""
- Last digits: "5" and "7"
- SumStrDigits<"5", "7", "0"> = 12
- 12 extends Digit? **No!**
- Split "12" → NextCarry = "1", CurrentDigit = "2"
- Recurse: <["5"], ["6"], "1", "2">

**Iteration 2:**

- Num1 = ["5"], Num2 = ["6"], Carry = "1", Accum = "2"
- Last digits: "5" and "6"
- SumStrDigits<"5", "6", "1"> = 12
- 12 extends Digit? **No!**
- Split "12" → NextCarry = "1", CurrentDigit = "2"
- Recurse: <[], [], "1", "22">

**Iteration 3:**

- Num1 = [], Num2 = [], Carry = "1", Accum = "22"
- Num1 is empty, but Carry is "1" (not "0")!
- Recurse: <["1"], [], "0", "22">

**Iteration 4:**

- Num1 = ["1"], Num2 = [], Carry = "0", Accum = "22"
- Num2 is empty, Carry is "0"
- Return: `${"1"}${"22"}` = "122"

```bash
npm run inspect -- --eval 'SumTupleOfStrDigits<["5", "5"], ["6", "7"]>'
# "122"

npm run inspect -- --eval 'Sum<55, 67>'
# 122
```

---

## Part 4: Multiplication

With `Sum` working, multiplication is just repeated addition:

```typescript
type Mul<
  A extends number,
  B extends number,
  Counter extends number = 0,
  ACC extends number = 0
> = A extends Counter ? ACC : Mul<A, B, Sum<1, Counter>, Sum<B, ACC>>;
```

**How it works:**

- Counter starts at 0, ACC (accumulator) starts at 0
- Each iteration: increment Counter, add B to ACC
- When Counter equals A, return ACC

**Example: 3 × 4**

| Iteration | Counter | ACC | Counter = A?   |
| --------- | ------- | --- | -------------- |
| 1         | 0       | 0   | No             |
| 2         | 1       | 4   | No             |
| 3         | 2       | 8   | No             |
| 4         | 3       | 12  | Yes! Return 12 |

```bash
npm run inspect -- --eval 'Mul<3, 4>'
# 12
```

---

## Summary

The type-level arithmetic works by:

1. **Converting numbers to strings** (`\`${55}\`` → "55")
2. **Splitting strings to digit arrays** ("55" → ["5", "5"])
3. **Using tuples to count** (digit "5" → tuple of length 5)
4. **Adding via tuple concatenation** (spread tuples, get length)
5. **Handling carry** (if sum ≥ 10, split into carry + digit)
6. **Building result right-to-left** (like manual addition)
7. **Converting back to number** ("122" → 122)

All of this happens at **compile time** - the types resolve to concrete number literals that TypeScript can check!
