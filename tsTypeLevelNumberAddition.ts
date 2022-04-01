type DigitToTuple<T extends Digit> = `${T}` extends infer TStr ? TStr extends keyof DigitToTupleMap ? DigitToTupleMap[TStr] : never : never;
type SplitDoubleDigit<T extends number> = `${T}` extends `${infer Digit1}${infer Digit2}` ? [StringToDigit<Digit1>, StringToDigit<Digit2>] : never;

// ^^ unused

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

type StringToDigit<T extends string> = T extends keyof StringToDigitMap ? StringToDigitMap[T] : never;

type StrToTuple<T extends string> = T extends `${infer Fst}${infer Rest}` ? [Fst, ...StrToTuple<Rest>] : [];

type StringToDigitMap = {
  '0': 0;
  '1': 1;
  '2': 2;
  '3': 3;
  '4': 4;
  '5': 5;
  '6': 6;
  '7': 7;
  '8': 8;
  '9': 9;
};

type SumStrDigits<D1 extends string, D2 extends string, D3 extends string> = [...StrDigitToTuple<D1>, ...StrDigitToTuple<D2>, ...StrDigitToTuple<D3>]['length'];

type ConcatStrings<T> = T extends [infer Fst, ...infer TRest] ? Fst extends string ? `${Fst}${ConcatStrings<TRest>}` : never : '';

// core
type SumTupleOfStrDigits<Num1, Num2, Carry extends string> =
  Num1 extends []
    ? Carry extends '0' ? ConcatStrings<Num2> : SumTupleOfStrDigits<[Carry], Num2, '0'>
    : Num2 extends []
      ? Carry extends '0' ? ConcatStrings<Num1> : SumTupleOfStrDigits<[Carry], Num1, '0'>
      : Num1 extends [...infer TRest1, infer TStrDigit1]
        ? Num2 extends [...infer TRest2, infer TStrDigit2]
          ? TStrDigit1 extends string
            ? TStrDigit2 extends string
              ? SumStrDigits<TStrDigit1, TStrDigit2, Carry> extends infer TSum
                ? TSum extends Digit
                  ? `${SumTupleOfStrDigits<TRest1, TRest2, '0'>}${TSum}`
                  : TSum extends number
                    ? `${TSum}` extends `${infer NextCarry}${infer CurrentDigit}`
                      ? `${SumTupleOfStrDigits<TRest1, TRest2, NextCarry>}${CurrentDigit}`
                      : never
                    : never
                : never
              : never
            : never
          : never
        : never;

type Range<TMax extends number, TCurrent extends Array<unknown> = []> =
  TCurrent['length'] extends TMax
    ? TCurrent
    : Range<TMax, [...TCurrent, TCurrent['length']]>;

type NumberRange = Range<999>[number]; // https://github.com/microsoft/TypeScript/pull/45711

type StringToNumberMap = {
  [Key in NumberRange as `${Key}`]: Key
};

type StringToNumber<T extends string> =
  T extends keyof StringToNumberMap
    ? StringToNumberMap[T]
    : never;

type Sum<Num1 extends number, Num2 extends number> = StringToNumber<SumTupleOfStrDigits<StrToTuple<`${Num1}`>, StrToTuple<`${Num2}`>, '0'>>;

type SumWithoutConvert<Num1 extends number, Num2 extends number> = SumTupleOfStrDigits<StrToTuple<`${Num1}`>, StrToTuple<`${Num2}`>, '0'>;

type test1 = Sum<55, 67>;
type test2 = Sum<256, 346>;

type test11 = SumWithoutConvert<55, 67>;
type test12 = SumWithoutConvert<256, 1546>;

type converted = StringToNumber<'970'>;
