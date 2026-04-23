# Real-Life Type Examples — Options Catalog

> Complex TypeScript types from published libraries that align with the constructs in this repo (`ts-type-arithmetic`): template literal types, `infer`, recursive conditional types, tuple pattern matching, mapped/indexed access, generic constraints.

**Runnable companion file:** [`learning/04-real-life-examples.ts`](./learning/04-real-life-examples.ts) — each option below that's marked "shown in runnable file" has a working (and one intentionally-broken) example there.

Pick any subset. Each option is self-contained and lists:

- the type itself (copy-pasteable)
- the file + permalink
- which construct from `src/arithmetic.ts` it mirrors
- a one-line "use it if you want to show…"

---

## Option 1 — `GetSubConfig<T, K>` (recursive template-literal walk) · _shown in [runnable file](./learning/04-real-life-examples.ts)_

**File:** [`packages/ckeditor5-utils/src/config.ts`](https://github.com/ckeditor/ckeditor5/blob/master/packages/ckeditor5-utils/src/config.ts)

```ts
export type OnlyObject<T> =
  Exclude<T, undefined | null | string | number | boolean | Array<any>>;

export type GetSubConfig<T, K> = K extends keyof T
  ? T[ K ]
  : K extends `${ infer K1 }.${ infer K2 }`
    ? K1 extends keyof T
      ? GetSubConfig<OnlyObject<T[ K1 ]>, K2>
      : unknown
    : unknown;
```

**Mirrors in your repo:** `StrToTuple` — both walk a string recursively, splitting on a delimiter via template-literal `infer`.

**Real-world payoff:**

```ts
editor.config.get( 'toolbar.items' );       // typed as string[] | undefined
editor.config.get( 'image.resizeOptions' ); // typed exactly from the config shape
```

**Use it if you want to show:** recursion + template-literal `infer` pair + conditional type with a tail-call.

---

## Option 2 — `ObservableChangeEvent` (branded event name)

**File:** [`packages/ckeditor5-utils/src/observablemixin.ts`](https://github.com/ckeditor/ckeditor5/blob/master/packages/ckeditor5-utils/src/observablemixin.ts) (near `@eventName ~Observable#change:{property}`)

```ts
export type ObservableChangeEvent<TValue = any> = {
  name: 'change' | `change:${ string }`;
  args: [ name: string, value: TValue, oldValue: TValue ];
};
```

**Mirrors in your repo:** `` `${Num1}` `` / `` `${TSum}${Accum}` `` — the same template-literal concatenation idiom, used here to brand an event name.

**Real-world payoff:**

```ts
observable.on<ObservableChangeEvent<number>>(
  'change:prop',
  ( evt, name, newValue, oldValue ) => { /* newValue: number */ }
);
```

**Use it if you want to show:** the simplest possible template-literal type (one line) and the "prefix + dynamic suffix" brand pattern.

---

## Option 3 — Event triad: `BaseEvent` + `GetEventInfo` + `GetCallback`

**File:** [`packages/ckeditor5-utils/src/emittermixin.ts`](https://github.com/ckeditor/ckeditor5/blob/master/packages/ckeditor5-utils/src/emittermixin.ts) (lines ~613–635)

```ts
export type BaseEvent = {
  name: string;
  args: Array<any>;
};

export type GetEventInfo<TEvent extends BaseEvent> =
  TEvent extends { eventInfo: EventInfo }
    ? TEvent[ 'eventInfo' ]
    : EventInfo<
        TEvent[ 'name' ],
        ( TEvent extends { return: infer TReturn } ? TReturn : unknown )
      >;

export type GetCallback<TEvent extends BaseEvent> =
  ( this: Emitter, ev: GetEventInfo<TEvent>, ...args: TEvent[ 'args' ] ) => void;
```

**Mirrors in your repo:** `StringToNumber` with `` T extends `${infer Res extends number}` `` — the `infer TReturn` inside a conditional is the same move. And the layered composition (`GetCallback` → `GetEventInfo` → `BaseEvent`) mirrors `Sum` → `SumStringNumbers` → `SumTupleOfStrDigits`.

**Real-world payoff:** event callbacks get typed `args`, `return`, and `eventInfo` shape derived from the event spec — no hand-written overloads.

**Use it if you want to show:** `infer TReturn` inside a conditional, plus "types built on other types" composition.

---

## Option 4 — `ObservableSingleBindChain<TKey, TVal>` (generics + overloads + indexed access)

**File:** [`packages/ckeditor5-utils/src/observablemixin.ts` (L1253)](https://github.com/ckeditor/ckeditor5/blob/master/packages/ckeditor5-utils/src/observablemixin.ts#L1253)

Trimmed to the first three `to(…)` overloads to keep it readable on one screen:

```ts
export interface ObservableSingleBindChain<TKey extends string, TVal> {
  to<O extends ObservableWithProperty<TKey, TVal>>(
    observable: O
  ): void;

  to<O extends ObservableWithProperty<TKey>>(
    observable: O,
    callback: ( value: O[ TKey ] ) => TVal
  ): void;

  to<O extends ObservableWithProperty<K, TVal>, K extends keyof O>(
    observable: O,
    key: K
  ): void;

  // …plus 2-, 3-, 4-source variants with each slot constrained the same way
}
```

**Mirrors in your repo:**

- Multi-parameter generic constraints (same as `Sum<Num1 extends number, Num2 extends number>`).
- **Indexed access `O[ TKey ]`** — same idiom as `DigitToTupleMap[ T ]` in `arithmetic.ts`.
- Constraints that *reference earlier type parameters* (`O extends ObservableWithProperty<TKey, TVal>`), like how `Mul<A, B, Counter, ACC>` wires parameters through each recursion.

**Real-world payoff:**

```ts
button.bind( 'isEnabled' ).to( command );
//      ^^^^^^^^^^^ TKey='isEnabled', TVal=boolean
//                         ^^^^^^^ must have an isEnabled:boolean slot
```

**Use it if you want to show:** how the same type params flow across a whole API surface, and how overload resolution + indexed access give callers an "impossible to misuse" chain API.

---

## Option 5 — `DecoratedMethodEvent` (Parameters / ReturnType / keyof filtering)

**File:** [`packages/ckeditor5-utils/src/observablemixin.ts`](https://github.com/ckeditor/ckeditor5/blob/master/packages/ckeditor5-utils/src/observablemixin.ts) (immediately above `ObservableSingleBindChain`, ~L1244)

```ts
export type DecoratedMethodEvent<
  TObservable extends Observable & { [ N in TName ]: ( ...args: Array<any> ) => any },
  TName extends keyof TObservable & string
> = {
  name: TName;
  args: [ Parameters<TObservable[ TName ]> ];
  return: ReturnType<TObservable[ TName ]>;
};
```

**Mirrors in your repo:** `SumTupleOfStrDigits` uses tuple `infer` to pull pieces out of array types; here `Parameters<F>` / `ReturnType<F>` are the built-in form of the same idea (they're both defined with `infer` under the hood). And `TName extends keyof TObservable & string` is the same intersection-as-filter trick your code uses with `Digit`.

**Real-world payoff:** decorating any method gives you a typed event whose `args` tuple is the method's own parameters.

**Use it if you want to show:** **composition of built-in utility types** + `keyof T & string` filtering + tuple-of-parameters trick.

---

## Option 6 — `Mixed<Base, Mixin>` (class-level intersection)

**File:** [`packages/ckeditor5-utils/src/mix.ts`](https://github.com/ckeditor/ckeditor5/blob/master/packages/ckeditor5-utils/src/mix.ts)

```ts
export type Constructor<Instance = object> =
  abstract new ( ...args: Array<any> ) => Instance;

export type Mixed<Base extends Constructor, Mixin extends object> = {
  new ( ...args: ConstructorParameters<Base> ): Mixin & InstanceType<Base>;
  prototype: Mixin & InstanceType<Base>;
} & {
  // static fields from Base…
};
```

**Mirrors in your repo:** less direct — but shows how **built-in utility types** (`ConstructorParameters`, `InstanceType`) compose, echoing how your `Sum` composes simpler types.

**Real-world payoff:** every `ObservableMixin`, `EmitterMixin`, `BubblingEmitterMixin` etc. is typed through this.

**Use it if you want to show:** the type system operating on **classes**, not just values — a different axis from everything above.

---

## Option 7 — `@ccssmnn/intl` `messages` + `createIntl` (typed ICU placeholders) · _shown in [runnable file](./learning/04-real-life-examples.ts)_

**Package:** [`@ccssmnn/intl`](https://github.com/ccssmnn/intl) — dependency already in this repo

```ts
import { messages, createIntl } from '@ccssmnn/intl';

const copy = messages( {
  greeting: 'Hello {$name}!',
  count:    'You have {$num :number} items',
} );

const t = createIntl( copy, 'en' );

t( 'greeting', { name: 'World' } ); // "Hello World!"
t( 'count',    { num: 42 } );       // "You have 42 items"
t( 'count',    { num: 'dummy' } );  // ❌ Type 'string' is not assignable to type 'number'
```

**Mirrors in your repo:** this is exactly the `StrToTuple` playbook applied to ICU placeholders — the literal message string (`'You have {$num :number} items'`) is parsed at the type level using `` `${infer …}` `` to extract `{$num}` and its `:number` tag, then turned into a required params type `{ num: number }`.

**Real-world payoff:** no runtime validation of placeholder types, no boilerplate schemas — just write the message string, and TypeScript derives the correct call signature from the literal.

**Use it if you want to show:** the same template-literal-infer trick you teach on numbers, applied to a real i18n library that ships on npm.

---

## Quick comparison matrix

| Option | Template literal | `infer` | Recursion | Indexed access / `keyof` | Built-in utility types | One-liner? |
|--------|:---------------:|:-------:|:---------:|:-----------------------:|:---------------------:|:----------:|
| 1 `GetSubConfig` | ✅ (split on `.`) | ✅ (`K1`, `K2`) | ✅ | ✅ (`T[K]`, `keyof T`) | — | no |
| 2 `ObservableChangeEvent` | ✅ (`` `change:${string}` ``) | — | — | — | — | **yes** |
| 3 Event triad | — | ✅ (`infer TReturn`) | — | ✅ (`TEvent['name']`) | — | small |
| 4 `ObservableSingleBindChain` | — | — | — | ✅ (`O[TKey]`, `keyof O`) | — | no |
| 5 `DecoratedMethodEvent` | — | (indirect) | — | ✅ (`keyof T & string`) | ✅ (`Parameters`, `ReturnType`) | **yes** |
| 6 `Mixed` | — | — | — | — | ✅ (`ConstructorParameters`, `InstanceType`) | **yes** |
| 7 `@ccssmnn/intl` | ✅ (`{$var :tag}`) | ✅ (parses placeholders) | ✅ | ✅ | — | **yes** |

---

## Suggested groupings (pick a row)

- **Closest to `StrToTuple` / `Sum` story:** Option 1 alone is enough.
- **"Same trick, different flavors":** Options 1 + 2 (recursive walk + template-literal brand).
- **Full tour of the `utils` package:** Options 1 + 2 + 4 + 5 — covers all the construct axes in your repo.
- **`ObservableSingleBindChain` plus what pairs best with it:** Options 4 + 5 — they sit next to each other in the same file and together show "same codebase, two complementary idioms".
- **Two libraries, same trick:** Options 1 + 7 — CKEditor5 walks a `'a.b.c'` path; `@ccssmnn/intl` walks a message template. Both use template-literal `infer` recursively to turn a literal string into a structured type.

---

## Verification notes

- Fetched from `ckeditor/ckeditor5@master` via `gh api`.
- File paths and line anchors as of today:
  - `packages/ckeditor5-utils/src/config.ts` — `GetSubConfig`, `OnlyObject`
  - `packages/ckeditor5-utils/src/observablemixin.ts` — `ObservableChangeEvent`, `DecoratedMethodEvent` (~L1244), `ObservableSingleBindChain` (L1253)
  - `packages/ckeditor5-utils/src/emittermixin.ts` — `BaseEvent`, `GetEventInfo`, `GetCallback` (L613–635)
  - `packages/ckeditor5-utils/src/mix.ts` — `Constructor`, `Mixed`
- For `@ccssmnn/intl`: [`ccssmnn/intl`](https://github.com/ccssmnn/intl) on GitHub. Implementation in `src/core.ts` (`messages`, `createIntl`, internal `MessageParams<T>` etc.).
- License note: CKEditor5 is GPL-2+; `@ccssmnn/intl` is MIT. Small attributable snippets are fine with a source link.

---

## Runnable file

The two options marked _"shown in runnable file"_ are demonstrated end-to-end, with both valid and intentionally broken call-sites, in [`learning/04-real-life-examples.ts`](./learning/04-real-life-examples.ts). The broken lines are pinned with `@ts-expect-error` so the file compiles as-is; remove the `@ts-expect-error` line to see the actual TypeScript error in context.
