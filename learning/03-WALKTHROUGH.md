# SumTupleOfStrDigits: Complete State Walkthrough

This document traces through two examples that together cover **all 6 possible states** in the `SumTupleOfStrDigits` algorithm.

## The 6 States

```typescript
type SumTupleOfStrDigits<
  Num1 extends readonly string[],
  Num2 extends readonly string[],
  Carry extends string = '0',
  Accum extends string = ''
> =
  // State A: Num1 empty, no carry → return result
  Num1 extends []
    ? Carry extends '0'
      ? `${ConcatStrings<Num2>}${Accum}`
      // State B: Num1 empty, has carry → recurse with carry as new Num1
      : SumTupleOfStrDigits<[Carry], Num2, '0', Accum>
    // State C: Num2 empty, no carry → return result
    : Num2 extends []
      ? Carry extends '0'
        ? `${ConcatStrings<Num1>}${Accum}`
        // State D: Num2 empty, has carry → recurse with carry as new Num1
        : SumTupleOfStrDigits<[Carry], Num1, '0', Accum>
      // Extract last digit from each number (right-to-left processing)
      : Num1 extends [...infer TRest1 extends readonly string[], infer TStrDigit1 extends string]
        ? Num2 extends [...infer TRest2 extends readonly string[], infer TStrDigit2 extends string]
          ? SumStrDigits<TStrDigit1, TStrDigit2, Carry> extends infer TSum extends number
            // State E: Both have digits, sum is single digit (0-9) → no carry
            ? TSum extends Digit
              ? SumTupleOfStrDigits<TRest1, TRest2, '0', `${TSum}${Accum}`>
              // State F: Both have digits, sum is two digits (10-18) → with carry
              : `${TSum}` extends `${infer NextCarry}${infer CurrentDig}`
                ? SumTupleOfStrDigits<TRest1, TRest2, NextCarry, `${CurrentDig}${Accum}`>
                : never
            : never
          : never
        : never;
```

| State | Condition                  | Action                           |
| ----- | -------------------------- | -------------------------------- |
| **A** | Num1 = [], Carry = "0"     | Return `Num2 + Accum`            |
| **B** | Num1 = [], Carry ≠ "0"     | Recurse with `[Carry]` as Num1   |
| **C** | Num2 = [], Carry = "0"     | Return `Num1 + Accum`            |
| **D** | Num2 = [], Carry ≠ "0"     | Recurse with `[Carry]` as Num1   |
| **E** | Both have digits, sum < 10 | Recurse with Carry = "0"         |
| **F** | Both have digits, sum ≥ 10 | Recurse with Carry = first digit |

---

## Example 1: Sum<195, 86> = 281

**Covers states: A, D, E, F**

This example has different-length numbers and multiple carries.

### Step-by-Step Walkthrough

```
Sum<195, 86>
→ StringToNumber<SumStringNumbers<"195", "86">>
→ StringToNumber<SumTupleOfStrDigits<["1","9","5"], ["8","6"]>>
```

**Iteration 1** — State F (both have digits, sum ≥ 10)

- Extract last digits: "5" and "6"
- `SumStrDigits<"5", "6", "0">` = 11
- 11 is NOT a single digit → split into carry "1" and digit "1"
- Recurse with Carry = "1", Accum = "1"

**Iteration 2** — State F (both have digits, sum ≥ 10)

- Extract last digits: "9" and "8"
- `SumStrDigits<"9", "8", "1">` = 18
- 18 is NOT a single digit → split into carry "1" and digit "8"
- Recurse with Carry = "1", Accum = "81"

**Iteration 3** — State D (Num2 empty, has carry)

- Num2 is now empty `[]`, but we still have Carry = "1"
- Can't just return - must add the carry to remaining Num1
- Recurse: `SumTupleOfStrDigits<["1"], ["1"], "0", "81">`
- (The carry "1" becomes the new Num2!)

**Iteration 4** — State E (both have digits, sum < 10)

- Extract last digits: "1" and "1"
- `SumStrDigits<"1", "1", "0">` = 2
- 2 IS a single digit → no carry needed
- Recurse with Carry = "0", Accum = "281"

**Iteration 5** — State A (Num1 empty, no carry)

- Both Num1 and Num2 are empty `[]`
- Carry is "0" → no more work needed
- Return: `"" + "281"` = "281"

```
→ StringToNumber<"281">
→ 281
```

### Iteration Table

| Iter | Num1          | Num2      | Carry | Accum | Digit Sum | State | Action             |
| ---- | ------------- | --------- | ----- | ----- | --------- | ----- | ------------------ |
| 1    | ["1","9","5"] | ["8","6"] | "0"   | ""    | 5+6+0=11  | **F** | Split 11→"1","1"   |
| 2    | ["1","9"]     | ["8"]     | "1"   | "1"   | 9+8+1=18  | **F** | Split 18→"1","8"   |
| 3    | ["1"]         | []        | "1"   | "81"  | —         | **D** | Move carry to Num2 |
| 4    | ["1"]         | ["1"]     | "0"   | "81"  | 1+1+0=2   | **E** | No carry           |
| 5    | []            | []        | "0"   | "281" | —         | **A** | **Return "281"**   |

```bash
# Direct call to the algorithm
npm run inspect -- --eval 'SumTupleOfStrDigits<["1","9","5"], ["8","6"]>'
# "281"

npm run inspect -- --eval 'Sum<195, 86>'
# 281
```

---

## Example 2: Sum<99, 1> = 100

**Covers states: B, C, D, F**

This example shows what happens when carries cascade all the way to create a new digit.

### Step-by-Step Walkthrough

```
Sum<99, 1>
→ StringToNumber<SumStringNumbers<"99", "1">>
→ StringToNumber<SumTupleOfStrDigits<["9","9"], ["1"]>>
```

**Iteration 1** — State F (both have digits, sum ≥ 10)

- Extract last digits: "9" and "1"
- `SumStrDigits<"9", "1", "0">` = 10
- 10 is NOT a single digit → split into carry "1" and digit "0"
- Recurse with Carry = "1", Accum = "0"

**Iteration 2** — State D (Num2 empty, has carry)

- Num2 is now empty `[]`, but we have Carry = "1"
- Recurse: `SumTupleOfStrDigits<["1"], ["9"], "0", "0">`
- (The carry "1" becomes the new Num2!)

**Iteration 3** — State F (both have digits, sum ≥ 10)

- Extract last digits: "9" and "1"
- `SumStrDigits<"9", "1", "0">` = 10
- 10 is NOT a single digit → split into carry "1" and digit "0"
- Recurse with Carry = "1", Accum = "00"

**Iteration 4** — State B (Num1 empty, has carry)

- Num1 is now empty `[]`, but we have Carry = "1"
- Recurse: `SumTupleOfStrDigits<["1"], [], "0", "00">`
- (The carry "1" becomes the new Num1!)

**Iteration 5** — State C (Num2 empty, no carry)

- Num2 is empty `[]` and Carry is "0"
- Return: `ConcatStrings<["1"]>` + "00" = "1" + "00" = "100"

```
→ StringToNumber<"100">
→ 100
```

### Iteration Table

| Iter | Num1      | Num2  | Carry | Accum | Digit Sum | State | Action             |
| ---- | --------- | ----- | ----- | ----- | --------- | ----- | ------------------ |
| 1    | ["9","9"] | ["1"] | "0"   | ""    | 9+1+0=10  | **F** | Split 10→"1","0"   |
| 2    | ["9"]     | []    | "1"   | "0"   | —         | **D** | Move carry to Num2 |
| 3    | ["9"]     | ["1"] | "0"   | "0"   | 9+1+0=10  | **F** | Split 10→"1","0"   |
| 4    | []        | []    | "1"   | "00"  | —         | **B** | Move carry to Num1 |
| 5    | ["1"]     | []    | "0"   | "00"  | —         | **C** | **Return "100"**   |

```bash
# Direct call to the algorithm
npm run inspect -- --eval 'SumTupleOfStrDigits<["9","9"], ["1"]>'
# "100"

npm run inspect -- --eval 'Sum<99, 1>'
# 100
```

---

## State Coverage Summary

| State | Description                  | Example 1 (195+86) | Example 2 (99+1) |
| ----- | ---------------------------- | :----------------: | :--------------: |
| **A** | Num1=[], Carry="0" → return  |       Iter 5       |        —         |
| **B** | Num1=[], Carry≠"0" → recurse |         —          |      Iter 4      |
| **C** | Num2=[], Carry="0" → return  |         —          |      Iter 5      |
| **D** | Num2=[], Carry≠"0" → recurse |       Iter 3       |      Iter 2      |
| **E** | Sum < 10 → no carry          |       Iter 4       |        —         |
| **F** | Sum ≥ 10 → with carry        |      Iter 1,2      |     Iter 1,3     |

**Together, these two examples cover all 6 states!**

---

## Try It Yourself

```bash
# Verify the results
npm run inspect -- --eval 'Sum<195, 86>' 'Sum<99, 1>'

# Call SumTupleOfStrDigits directly
npm run inspect -- --eval 'SumTupleOfStrDigits<["1","9","5"], ["8","6"]>'
npm run inspect -- --eval 'SumTupleOfStrDigits<["9","9"], ["1"]>'

# See intermediate steps
npm run inspect -- --eval 'StrToTuple<"195">' 'StrToTuple<"86">'
npm run inspect -- --eval 'SumStrDigits<"5", "6", "0">'
npm run inspect -- --eval 'SumStrDigits<"9", "8", "1">'
npm run inspect -- --eval 'SumStrDigits<"9", "1", "0">'
```
