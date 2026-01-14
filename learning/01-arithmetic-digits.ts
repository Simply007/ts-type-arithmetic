// Simple type-level arithmetic for single digits only
// This demonstrates the core "tuple length" trick without multi-digit complexity

type Digit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

// Map each digit to a tuple of that length
type DigitToTuple = {
  0: [];
  1: [0];
  2: [0, 0];
  3: [0, 0, 0];
  4: [0, 0, 0, 0];
  5: [0, 0, 0, 0, 0];
  6: [0, 0, 0, 0, 0, 0];
  7: [0, 0, 0, 0, 0, 0, 0];
  8: [0, 0, 0, 0, 0, 0, 0, 0];
  9: [0, 0, 0, 0, 0, 0, 0, 0, 0];
};

// The core trick: spread two tuples and get the combined length
// Example: SimpleSum<3, 5>
//   1. DigitToTuple[3] = [0, 0, 0]
//   2. DigitToTuple[5] = [0, 0, 0, 0, 0]
//   3. [...[0,0,0], ...[0,0,0,0,0]] = [0, 0, 0, 0, 0, 0, 0, 0]
//   4. Length = 8
type SimpleSum<A extends Digit, B extends Digit> =
  [...DigitToTuple[A], ...DigitToTuple[B]]['length'];

// ============ WALKTHROUGH ============

type A = DigitToTuple[3]; // [0,0,0]
type B = DigitToTuple[5]; // [0,0,0,0,0]
type LengthA = A['length'] // 3
type ABConcat = [...A, ...B] // [0,0,0,0,0,0,0,0]
type SumAB = ABConcat['length'] // 8

// ============ TESTS ============
// Test types (inspect with: npm run inspect -- learning/01-arithmetic-digits.ts --pattern "^test")
type test1 = SimpleSum<3, 5>;  // 8
type test2 = SimpleSum<9, 9>;  // 18
type test3 = SimpleSum<0, 0>;  // 0
type test4 = SimpleSum<1, 1>;  // 2
type test5 = SimpleSum<4, 6>;  // 10