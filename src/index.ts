export { Sum, Mul } from './arithmetic.js';

import { SourceMap } from 'node:module';
import type { Sum, Mul } from './arithmetic.js';

export const add = <A extends number, B extends number>(a: A, b: B): Sum<A, B> => (a + b) as Sum<A, B>;

export const mul = <A extends number, B extends number>(a: A, b: B): Mul<A, B> => (a * b) as Mul<A, B>;
