import { expectType } from 'tsd';
import {
  Digit,
  DigitToTupleMap,
  StrDigitToTuple,
  StrToTuple,
  SumStrDigits,
  ConcatStrings,
  SumTupleOfStrDigits,
} from '../dist/arithmetic.js';

// ============================================
// Test Digit type
// ============================================
expectType<0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9>(0 as Digit);

// ============================================
// Test DigitToTupleMap
// ============================================
expectType<[]>([] as DigitToTupleMap['0']);
expectType<[0]>([0] as DigitToTupleMap['1']);
expectType<[0, 0, 0, 0, 0]>([0, 0, 0, 0, 0] as DigitToTupleMap['5']);
expectType<[0, 0, 0, 0, 0, 0, 0, 0, 0]>([0, 0, 0, 0, 0, 0, 0, 0, 0] as DigitToTupleMap['9']);

// ============================================
// Test StrDigitToTuple
// ============================================
expectType<[]>([] as StrDigitToTuple<'0'>);
expectType<[0, 0, 0]>([0, 0, 0] as StrDigitToTuple<'3'>);
expectType<[0, 0, 0, 0, 0, 0, 0]>([0, 0, 0, 0, 0, 0, 0] as StrDigitToTuple<'7'>);
expectType<never>(0 as never as StrDigitToTuple<'x'>);

// ============================================
// Test StrToTuple
// ============================================
expectType<[]>([] as StrToTuple<''>);
expectType<['5']>(['5'] as StrToTuple<'5'>);
expectType<['6', '7']>(['6', '7'] as StrToTuple<'67'>);
expectType<['1', '2', '3']>(['1', '2', '3'] as StrToTuple<'123'>);
expectType<['1', '9', '5']>(['1', '9', '5'] as StrToTuple<'195'>);

// ============================================
// Test SumStrDigits (core addition trick)
// ============================================
expectType<5>(5 as SumStrDigits<'2', '3', '0'>);
expectType<12>(12 as SumStrDigits<'5', '7', '0'>);
expectType<12>(12 as SumStrDigits<'5', '6', '1'>);
expectType<18>(18 as SumStrDigits<'9', '8', '1'>);
expectType<0>(0 as SumStrDigits<'0', '0', '0'>);
expectType<9>(9 as SumStrDigits<'9', '0', '0'>);

// ============================================
// Test ConcatStrings
// ============================================
expectType<''>('' as ConcatStrings<[]>);
expectType<'6'>('6' as ConcatStrings<['6']>);
expectType<'67'>('67' as ConcatStrings<['6', '7']>);
expectType<'123'>('123' as ConcatStrings<['1', '2', '3']>);

// ============================================
// Test SumTupleOfStrDigits (main algorithm)
// ============================================
// Simple case
expectType<'5'>('5' as SumTupleOfStrDigits<['2'], ['3']>);

// Two digits, no carry
expectType<'46'>('46' as SumTupleOfStrDigits<['1', '2'], ['3', '4']>);

// With carry
expectType<'122'>('122' as SumTupleOfStrDigits<['5', '5'], ['6', '7']>);

// Different lengths (from WALKTHROUGH examples)
expectType<'281'>('281' as SumTupleOfStrDigits<['1', '9', '5'], ['8', '6']>);
expectType<'100'>('100' as SumTupleOfStrDigits<['9', '9'], ['1']>);

// Edge cases
expectType<'0'>('0' as SumTupleOfStrDigits<['0'], ['0']>);
expectType<'18'>('18' as SumTupleOfStrDigits<['9'], ['9']>);
