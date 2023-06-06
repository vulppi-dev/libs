import { promiseDelay } from '@vulppi/toolbelt'
import type { Operation as Op } from 'just-diff'
import { diff } from 'just-diff'
import _ from 'lodash'
import type { DataKey, UserContext } from './tools'

const voidFunction = () => {}

type Operation = {
  op: Op
  path: Array<string | number>
  value: any
}

function buildOperations(
  before: Record<string, any>,
  after: Record<string, any>,
) {
  return diff(before, after)
}

export abstract class SyncProvider {
  private _dataMap = new Map<string, Record<string, any>>()
  private _lockedMap = new Map<string, Record<string, any>>()
  private _lockMap = new Map<string, boolean>()
  private _waitMap = new Map<string, (() => Promise<void>)[]>()

  //
  get dataMap() {
    return this._dataMap
  }

  public async concurrencySet<T extends Record<string, any>>(
    key: DataKey,
    value: T,
    context: UserContext,
  ) {
    // Not exists key, apply operations and return
    if (!this._dataMap.has(key)) {
      await this._applyOperations(key, buildOperations({}, value), context)
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
      const prev = this._lockedMap.get(key) || (await this.get(key, context))
      this._lockMap.set(key, true)
      await this._applyOperations(key, buildOperations(prev, value), context)
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
    operations: Operation[],
    context: UserContext,
  ) {
    const value = structuredClone(this.dataMap.get(key) || {})

    operations.forEach((op) => {
      switch (op.op) {
        case 'add':
        case 'replace':
          _.set(value, op.path, op.value)
          break
        case 'remove':
          _.unset(value, op.path)
          break
      }
    })

    this.dataMap.set(key, value)

    if (operations.length) {
      this.set(key, value, context)
    }
  }

  abstract get<T extends Record<string, any>>(
    key: DataKey,
    context: UserContext,
  ): Promise<T> | T

  abstract set(
    key: DataKey,
    value: Record<string, any>,
    context: UserContext,
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
  async get<T extends Record<string, any>>(key: DataKey, context: UserContext) {
    if (!this.dataMap.has(key)) {
      this.dataMap.set(key, {} as T)
    }
    return this.dataMap.get(key) as T
  }

  async set(key: DataKey, data: Record<string, any>, context: UserContext) {}

  async clear(key: DataKey, context: UserContext) {
    return this.dataMap.delete(key)
  }

  async clearAll(context: UserContext) {}
}
