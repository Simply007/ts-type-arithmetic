// Intermediate: Multi-digit addition WITHOUT carry
// Same structure as arithmetic.ts, but simplified to show the core pattern
// This demonstrates WHY carry handling is needed

type Digit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

type DigitToTupleMap = {
  '0': [];
  '1': [0];
  '2': [0, 0];
  '3': [0, 0, 0];
  '4': [0, 0, 0, 0];
  '5': [0, 0, 0, 0, 0];
  '6': [0, 0, 0, 0, 0, 0];
  '7': [0, 0, 0, 0, 0, 0, 0];
  '8': [0, 0, 0, 0, 0, 0, 0, 0];
  '9': [0, 0, 0, 0, 0, 0, 0, 0, 0];
};

// Convert string digit to tuple
type StrDigitToTuple<T extends string> =
  T extends keyof DigitToTupleMap ? DigitToTupleMap[T] : never;

// Split string "123" → ["1", "2", "3"]
type StrToTuple<T extends string, Accum extends readonly string[] = []> =
  T extends `${infer Fst}${infer Rest}`
    ? StrToTuple<Rest, [...Accum, Fst]>
    : Accum;

// Sum TWO string digits (no carry input)
type SumTwoStrDigits<D1 extends string, D2 extends string> =
  [...StrDigitToTuple<D1>, ...StrDigitToTuple<D2>]['length'];

// Join string array back: ["4", "6"] → "46"
type ConcatStrings<T extends readonly string[], Accum extends string = ''> =
  T extends [infer Fst extends string, ...infer Rest extends readonly string[]]
    ? ConcatStrings<Rest, `${Accum}${Fst}`>
    : Accum;

// Main recursive type: process right-to-left, accumulate result
// Structure matches arithmetic.ts but WITHOUT carry parameter
type SumTupleNoCarry<
  Num1 extends readonly string[],
  Num2 extends readonly string[],
  Accum extends string = ''
> =
  // Base case: one side empty, prepend remaining digits
  Num1 extends []
    ? `${ConcatStrings<Num2>}${Accum}`
    : Num2 extends []
      ? `${ConcatStrings<Num1>}${Accum}`
      // Extract last digit from each (right-to-left processing)
      : Num1 extends [...infer Rest1 extends string[], infer Last1 extends string]
        ? Num2 extends [...infer Rest2 extends string[], infer Last2 extends string]
          // Sum last digits, prepend to accumulator, recurse on rest
          ? SumTwoStrDigits<Last1, Last2> extends infer TSum extends number
            ? SumTupleNoCarry<Rest1, Rest2, `${TSum}${Accum}`>
            : never
          : never
        : never;

// Public API (same signature as arithmetic.ts)
type SumStringNumbers<Num1 extends string, Num2 extends string> =
  SumTupleNoCarry<StrToTuple<Num1>, StrToTuple<Num2>>;

type StringToNumber<T extends string> =
  T extends `${infer Res extends number}` ? Res : never;

type Sum<Num1 extends number, Num2 extends number> =
  StringToNumber<SumStringNumbers<`${Num1}`, `${Num2}`>>;

// ============ TESTS ============
// Works correctly (no digit overflow):
type test1 = Sum<12, 34>; // 46 ✓
type test2 = Sum<11, 22>; // 33 ✓
type test3 = Sum<100, 23>; // 123 ✓
type test3ba = Sum<0, 23>; // 1023 ✓
type test3bb = Sum<23, 0>; // 1023 ✓
type test3b = Sum<1000, 23>; // 1023 ✓
type test3c = Sum<23, 1000>; // 1023 ✓
type test4 = Sum<5, 3>; // 8 ✓

// BREAKS without carry (demonstrates WHY carry is needed):
type test5 = Sum<19, 11>; // "210" instead of 30 ✗
type test6 = Sum<99, 1>; // "910" instead of 100 ✗
type test7 = Sum<15, 15>; // "210" instead of 30 ✗
