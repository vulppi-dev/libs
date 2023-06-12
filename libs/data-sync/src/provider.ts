import { promiseDelay } from '@vulppi/toolbelt'
import { set, unset } from 'lodash'
import type { DataKey, Operations, UserContext } from './tools'

const voidFunction = () => {}

export type AdditionalOperationsCallback = (ops: Operations[]) => void

export type SetContext = {
  context: UserContext
  operations: Operations[]
  additionalOps: AdditionalOperationsCallback
}

export abstract class SyncProvider {
  private _dataMap = new Map<string, Record<string, any>>()
  private _lockedMap = new Map<string, Record<string, any>>()
  private _lockMap = new Map<string, boolean>()
  private _waitMap = new Map<string, (() => Promise<void>)[]>()

  get dataMap() {
    return this._dataMap
  }

  public async concurrencySet(
    key: DataKey,
    ops: Operations[],
    context: UserContext,
    additionalOps: AdditionalOperationsCallback,
  ) {
    if (!ops.length) return voidFunction

    // Not exists key, apply operations and return
    if (!this._dataMap.has(key)) {
      await this._applyOperations(key, ops, context, additionalOps)
      return voidFunction
    }

    if (!this._waitMap.has(key)) {
      this._waitMap.set(key, [])
    }
    // Test if operation is locked
    const listPromise = this._waitMap.get(key)!
    const locked = !!this._lockMap.get(key) || !!listPromise.length

    const callSet = async () => {
      !locked && this._lockedMap.set(key, await this.get(key, context))
      this._lockMap.set(key, true)
      await this._applyOperations(key, ops, context, additionalOps)
      return async () => {
        const cb = listPromise.shift()
        await cb?.()
        if (!listPromise.length) {
          this._lockMap.delete(key)
          this._lockedMap.delete(key)
        }
      }
    }

    if (locked) {
      let resolve: VoidFunction | null = null
      // If locker wait for unlock
      const promise = new Promise<void>((res, rej) => {
        let tid: NodeJS.Timeout | null = null

        resolve = () => {
          tid && clearTimeout(tid)
          res()
        }

        // Timeout if not unlock
        tid = setTimeout(() => {
          rej(new Error('timeout'))
        }, 20000)
      })
      listPromise.push(async () => {
        let trying = 100
        // Protect for async resolve call
        do {
          if (!resolve) {
            trying--
            await promiseDelay(10)
            continue
          }
          resolve()
          break
        } while (trying)
      })
      await promise
    }
    return await callSet()
  }

  private async _applyOperations(
    key: DataKey,
    operations: Operations[],
    context: UserContext,
    additionalOps: AdditionalOperationsCallback,
  ) {
    const value = structuredClone(this.dataMap.get(key) || {})

    const apply = (ops: Operations[]) => {
      ops.forEach(([op, path, after, before]) => {
        const safePath = path.map((p) => {
          if (/^\d+$/.test(p)) return parseInt(p)
          return p
        })
        switch (op) {
          case 'set':
            set(value, safePath, after)
            break
          case 'delete':
            unset(value, safePath)
            break
        }
      })
    }

    apply(operations)
    this.set(key, value, {
      context,
      additionalOps: (ops: Operations[]) => {
        additionalOps(ops)
        apply(ops)
      },
      operations,
    })
    this._dataMap.set(key, value)
  }

  abstract get(key: DataKey, context: UserContext): Promise<any> | any

  abstract set(
    key: DataKey,
    value: Record<string, any>,
    context: SetContext,
  ): Promise<void> | void

  abstract clear(key: DataKey, context: UserContext): Promise<boolean> | boolean

  abstract clearAll(
    context: UserContext,
  ): Promise<boolean | void> | boolean | void
}

/**
 * Simple provider for store data in memory
 */
export class MemoryProvider extends SyncProvider {
  async get(key: DataKey, context: UserContext) {
    if (!this.dataMap.has(key)) {
      this.dataMap.set(key, {})
    }
    return this.dataMap.get(key)
  }

  async set(key: DataKey, data: Record<string, any>, context: SetContext) {}

  async clear(key: DataKey, context: UserContext) {
    return this.dataMap.delete(key)
  }

  async clearAll(context: UserContext) {}
}
