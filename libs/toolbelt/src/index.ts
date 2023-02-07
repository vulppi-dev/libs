export * from './functions'
export * from './math'
export * from './regexp'

export declare type Null = null | undefined

export declare type Nullable<T = any> = Null | T

export declare type NodeElement = Element | HTMLElement | SVGElement

export declare type Unstring<K extends string> = K | Omit<string, K>

export declare interface Directive<
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

export declare type ValuesOf<T extends readonly any[]> = T[number]

export declare type Args<F extends Function> = F extends (
  ...args: infer A
) => any
  ? A
  : never

export declare type Arguments<F extends Function> = Args<F>

export declare type Params<F extends Function> = Args<F>
