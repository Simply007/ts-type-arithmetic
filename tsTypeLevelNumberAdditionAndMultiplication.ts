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
type StrDigitToTuple<T extends string> = T extends keyof DigitToTupleMap ? DigitToTupleMap[T] : never;

type StrToTuple<T extends string, Accum extends readonly string[] = []> = T extends `${infer Fst}${infer Rest}` ? StrToTuple<Rest, [...Accum, Fst]> : Accum;
type SumStrDigits<D1 extends string, D2 extends string, D3 extends string> = [...StrDigitToTuple<D1>, ...StrDigitToTuple<D2>, ...StrDigitToTuple<D3>]['length'];
type ConcatStrings<T extends readonly string[], Accum extends string = ''> =
  T extends [infer Fst extends string, ...infer TRest extends readonly string[]]
    ? ConcatStrings<TRest, `${Accum}${Fst}`>
    : Accum;

// core
type SumTupleOfStrDigits<Num1 extends readonly string[], Num2 extends readonly string[], Carry extends string = '0', Accum extends string = ''> =
  Num1 extends []
    ? Carry extends '0' ? `${ConcatStrings<Num2>}${Accum}` : SumTupleOfStrDigits<[Carry], Num2, '0', Accum>
    : Num2 extends []
      ? Carry extends '0' ? `${ConcatStrings<Num1>}${Accum}` : SumTupleOfStrDigits<[Carry], Num1, '0', Accum>
      : Num1 extends [...infer TRest1 extends readonly string[], infer TStrDigit1 extends string]
        ? Num2 extends [...infer TRest2 extends readonly string[], infer TStrDigit2 extends string]
          ? SumStrDigits<TStrDigit1, TStrDigit2, Carry> extends infer TSum extends number
            ? TSum extends Digit
              ? SumTupleOfStrDigits<TRest1, TRest2, '0', `${TSum}${Accum}`>
              : `${TSum}` extends `${infer NextCarry}${infer CurrentDigit}`
                ? SumTupleOfStrDigits<TRest1, TRest2, NextCarry, `${CurrentDigit}${Accum}`>
                : never
            : never
          : never
        : never;

type SumStringNumbers<Num1 extends string, Num2 extends string> = SumTupleOfStrDigits<StrToTuple<Num1>, StrToTuple<Num2>>;
type StringToNumber<T extends string> = T extends `${infer Res extends number}` ? Res : never;
type Sum<Num1 extends number, Num2 extends number> = StringToNumber<SumStringNumbers<`${Num1}`, `${Num2}`>>;

type test1 = Sum<55, 67>;
type test2 = Sum<256, 346>;

type test11 = Sum<55, 67>;
type test12 = Sum<256, 1546>;

const add = <A extends number, B extends number>(a: A, b: B): Sum<A, B> => (a + b) as any;

const typedAddResult = add(54, 382);

export type Mul<A extends number, B extends number, Counter extends number = 0, ACC extends number = 0> =
  A extends Counter ? ACC : Mul<A, B, Sum<1, Counter>, Sum<B, ACC>>;

type testMul1 = Mul<2, 3>;
type testMul2 = Mul<220, 12>;

const mul = <A extends number, B extends number>(a: A, b: B): Mul<A, B> => (a * b) as any;

const typedMulResult = mul(32, 47);