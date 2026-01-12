import { expectType } from 'tsd';
import {
  Digit,
  DigitToTupleMap,
  StrDigitToTuple,
  StrToTuple,
  SumStrDigits,
  ConcatStrings,
  SumTupleOfStrDigits,
  SumStringNumbers,
  StringToNumber,
} from '../dist/arithmetic.js';

// Test value placeholders - actual values don't matter, only types are checked
const _ = 0;
const __ = '0';

// ============================================
// Test Digit type
// ============================================
expectType<0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9>(_ as Digit);

// ============================================
// Test DigitToTupleMap
// ============================================
expectType<[]>([] as DigitToTupleMap['0']);
expectType<[0]>([_] as DigitToTupleMap['1']);
expectType<[0, 0, 0, 0, 0]>([_, _, _, _, _] as DigitToTupleMap['5']);
expectType<[0, 0, 0, 0, 0, 0, 0, 0, 0]>([_, _, _, _, _, _, _, _, _] as DigitToTupleMap['9']);

// ============================================
// Test StrDigitToTuple
// ============================================
expectType<[]>([] as StrDigitToTuple<'0'>);
expectType<[0, 0, 0]>([_, _, _] as StrDigitToTuple<'3'>);
expectType<[0, 0, 0, 0, 0, 0, 0]>([_, _, _, _, _, _, _] as StrDigitToTuple<'7'>);
expectType<never>(_ as never as StrDigitToTuple<'x'>);

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
expectType<5>(_ as SumStrDigits<'2', '3', '0'>);
expectType<12>(_ as SumStrDigits<'5', '7', '0'>);
expectType<12>(_ as SumStrDigits<'5', '6', '1'>);
expectType<18>(_ as SumStrDigits<'9', '8', '1'>);
expectType<0>(_ as SumStrDigits<'0', '0', '0'>);
expectType<9>(_ as SumStrDigits<'9', '0', '0'>);

// ============================================
// Test ConcatStrings
// ============================================
expectType<''>(__ as ConcatStrings<[]>);
expectType<'6'>(__ as ConcatStrings<['6']>);
expectType<'67'>(__ as ConcatStrings<['6', '7']>);
expectType<'123'>(__ as ConcatStrings<['1', '2', '3']>);

// ============================================
// Test SumTupleOfStrDigits (main algorithm)
// ============================================
// Simple case
expectType<'5'>(__ as SumTupleOfStrDigits<['2'], ['3']>);

// Two digits, no carry
expectType<'46'>(__ as SumTupleOfStrDigits<['1', '2'], ['3', '4']>);

// With carry
expectType<'122'>(__ as SumTupleOfStrDigits<['5', '5'], ['6', '7']>);

// Different lengths (from WALKTHROUGH examples)
expectType<'281'>(__ as SumTupleOfStrDigits<['1', '9', '5'], ['8', '6']>);
expectType<'100'>(__ as SumTupleOfStrDigits<['9', '9'], ['1']>);

// Edge cases
expectType<'0'>(__ as SumTupleOfStrDigits<['0'], ['0']>);
expectType<'18'>(__ as SumTupleOfStrDigits<['9'], ['9']>);

// ============================================
// Test SumStringNumbers
// ============================================
expectType<'5'>(__ as SumStringNumbers<'2', '3'>);
expectType<'122'>(__ as SumStringNumbers<'55', '67'>);
expectType<'281'>(__ as SumStringNumbers<'195', '86'>);
expectType<'100'>(__ as SumStringNumbers<'99', '1'>);
expectType<'0'>(__ as SumStringNumbers<'0', '0'>);

// ============================================
// Test StringToNumber
// ============================================
expectType<5>(_ as StringToNumber<'5'>);
expectType<122>(_ as StringToNumber<'122'>);
expectType<1802>(_ as StringToNumber<'1802'>);
expectType<0>(_ as StringToNumber<'0'>);
expectType<never>(_ as never as StringToNumber<'abc'>);
