export * from './functions'
export * as math from './math'
export * as regexp from './regexp'

export declare type Null = null | undefined

export declare type Nullable<T = any> = Null | T

/**
 * Generic type for html elements
 */
export declare type NodeElement = Element | HTMLElement | SVGElement

/**
 * Accepts generic strings and known string keys
 */
export declare type Unstring<K extends string> = K | Omit<string, K>

/**
 * Svelte directive typing
 */
export declare interface SvelteDirective<
  P extends any = any,
  E extends NodeElement = NodeElement,
> {
  (node: E, params: P):
    | {
        update?: (params: P) => void
        destroy?: () => void
      }
    | undefined
    | void
}

export declare type VoidFunction = () => void

export declare type UnsubscribeList = (() => void)[]

/**
 * Union of values of an array
 */
export declare type ValuesOf<T extends readonly any[]> = T[number]

/**
 * Array of function parameters
 */
export declare type Args<F extends Function> = F extends (
  ...args: infer A
) => any
  ? A
  : never

export declare type Arguments<F extends Function> = Args<F>

export declare type Params<F extends Function> = Args<F>

/**
 * Make all properties in T optional (deep)
 * @example
 * type T0 = {
 *   a: {
 *     b: {
 *       c: number
 *     }
 *   }
 * }
 * type T1 = PartialDeep<T0> // { a?: { b?: { c?: number } } }
 */
export declare type PartialDeep<T> = {
  [P in keyof T]?: T[P] extends object ? PartialDeep<T[P]> : T[P]
}

/**
 * Make all properties in T required (deep)
 * @example
 * type T0 = {
 *   a?: {
 *     b?: {
 *       c?: number
 *     }
 *   }
 * }
 * type T1 = RequiredDeep<T0> // { a: { b: { c: number } } }
 */
export declare type RequiredDeep<T> = {
  [P in keyof T]-?: T[P] extends object ? RequiredDeep<T[P]> : T[P]
}

/**
 * Make all properties in T readonly (deep)
 */
export declare type ReadonlyDeep<T> = {
  readonly [P in keyof T]: T[P] extends object ? ReadonlyDeep<T[P]> : T[P]
}

type SNum = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
type SNum1 = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
export declare type Num = `${SNum}` | `${SNum1}${SNum}`

type ArgsObject = {
  readonly [K in Num]?: string | number
}

export declare type StringInjection<
  V extends string,
  A extends ArgsObject,
> = V extends `${infer L}$${infer K1 extends Num}${infer R}`
  ? A[K1] extends string
    ? StringInjection<`${L}"${A[K1]}"${R}`, Omit<A, K1>>
    : StringInjection<`${L}${A[K1]}${R}`, Omit<A, K1>>
  : V
