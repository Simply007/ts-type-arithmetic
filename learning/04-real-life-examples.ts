/**
 * Real-life complex TypeScript types from published libraries.
 *
 * Both examples below use the same constructs taught in this repo:
 *   • template literal types
 *   • `infer` inside conditional types
 *   • recursive type definitions
 *   • indexed access / `keyof`
 *
 * Lines marked ❌ are intentional type errors. They are pinned with
 * `@ts-expect-error` so this file still compiles — if the underlying
 * library ever changes in a way that makes the error go away, the
 * `@ts-expect-error` itself becomes a compile error, flagging the drift.
 *
 * See ../REAL_LIFE_EXAMPLES.md for more candidates and a discussion of
 * which constructs each one mirrors from ../src/arithmetic.ts.
 */

import type { EditorConfig, GetSubConfig } from 'ckeditor5';
import { messages, createIntl } from '@ccssmnn/intl';

// ─── CKEditor5 · GetSubConfig<T, K> ─────────────────────────────
// Source: packages/ckeditor5-utils/src/config.ts
//
// type GetSubConfig<T, K> = K extends keyof T
//   ? T[K]
//   : K extends `${infer K1}.${infer K2}`
//       ? K1 extends keyof T ? GetSubConfig<OnlyObject<T[K1]>, K2> : unknown
//       : unknown;
//
// Walks a dotted path through a config shape. Recursive conditional
// with a template-literal `infer` pair — same idea as `StrToTuple`
// in src/arithmetic.ts, just splitting on "." instead of every char.

// ✅ direct key — hits the first branch `K extends keyof T ? T[K] : …`
export type Toolbar = GetSubConfig<EditorConfig, 'toolbar'>;

// ✅ nested path — template-literal infer splits on "."
export type ToolbarItems = GetSubConfig<EditorConfig, 'toolbar.items'>;

// ❌ resolved type is ToolbarConfigItem[], not a string
// @ts-expect-error — 'bold, italic' is a string, not string[]
export const brokenItems: GetSubConfig<EditorConfig, 'toolbar.items'> = 'bold, italic';


// ─── @ccssmnn/intl · typed ICU-style placeholders ───────────────
// `messages(...)` brands each value with its literal string.
// `createIntl` parses that literal at the type level, extracts
// placeholders and their tags (e.g. `:number`), and turns them into
// a required params object per key. Pure template-literal-infer
// machinery — the same trick this repo uses on digits.

const copy = messages( {
	greeting: 'Hello {$name}!',
	count:    'You have {$num :number} items',
} );

const t = createIntl( copy, 'en' );

// ✅ placeholders satisfied with the correct types
export const greeting = t( 'greeting', { name: 'World' } ); // "Hello World!"
export const itemsMsg = t( 'count',    { num:  42 } );      // "You have 42 items"

// ❌ the `:number` tag pins `num` to number at the type level
// @ts-expect-error — 'dummy' is a string, not a number
export const brokenCount = t( 'count', { num: 'dummy' } );
