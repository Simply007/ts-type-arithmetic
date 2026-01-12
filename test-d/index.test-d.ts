import { expectType } from 'tsd';
import { Sum, Mul, add, mul } from '../dist/index.js';

// ============================================
// Test Sum type (high-level)
// ============================================
expectType<122>(0 as Sum<55, 67>);
expectType<602>(0 as Sum<256, 346>);
expectType<1802>(0 as Sum<256, 1546>);
expectType<281>(0 as Sum<195, 86>);
expectType<100>(0 as Sum<99, 1>);

// Sum edge cases
expectType<0>(0 as Sum<0, 0>);
expectType<100>(0 as Sum<100, 0>);
expectType<100>(0 as Sum<0, 100>);
expectType<5>(0 as Sum<2, 3>);
expectType<46>(0 as Sum<12, 34>);

// ============================================
// Test Mul type
// ============================================
expectType<6>(0 as Mul<2, 3>);
expectType<2640>(0 as Mul<220, 12>);
expectType<1504>(0 as Mul<32, 47>);

// Mul edge cases
expectType<0>(0 as Mul<0, 100>);
expectType<0>(0 as Mul<100, 0>);
expectType<1>(0 as Mul<1, 1>);
expectType<100>(0 as Mul<10, 10>);
expectType<12>(0 as Mul<3, 4>);

// ============================================
// Test runtime functions
// ============================================
const addResult = add(54, 382);
expectType<436>(addResult);

const mulResult = mul(32, 47);
expectType<1504>(mulResult);

const addSmall = add(2, 3);
expectType<5>(addSmall);

const mulSmall = mul(3, 4);
expectType<12>(mulSmall);
