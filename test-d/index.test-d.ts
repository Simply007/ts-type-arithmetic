import { expectType } from 'tsd';
import { Sum, Mul, add, mul } from '../dist/index.js';

// Test Sum type (from original test1, test2, test11, test12)
expectType<122>(0 as Sum<55, 67>);
expectType<602>(0 as Sum<256, 346>);
expectType<1802>(0 as Sum<256, 1546>);

// Test Sum edge cases
expectType<0>(0 as Sum<0, 0>);
expectType<100>(0 as Sum<100, 0>);
expectType<100>(0 as Sum<0, 100>);

// Test Mul type (from original testMul1, testMul2)
expectType<6>(0 as Mul<2, 3>);
expectType<2640>(0 as Mul<220, 12>);

// Test Mul edge cases
expectType<0>(0 as Mul<0, 100>);
expectType<0>(0 as Mul<100, 0>);
expectType<1>(0 as Mul<1, 1>);
expectType<100>(0 as Mul<10, 10>);

// Test runtime functions (from original typedAddResult, typedMulResult)
const addResult = add(54, 382);
expectType<436>(addResult);

const mulResult = mul(32, 47);
expectType<1504>(mulResult);
