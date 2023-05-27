import { promiseDelay } from '@vulppi/toolbelt'
import type { DataKey } from './tools'
import { diff, type Operation as Op } from 'just-diff'
import _ from 'lodash'

const voidFunction = () => {}

type Operation = {
  op: Op | 'increment'
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

  get dataMap() {
    return this._dataMap
  }

  public async concurrencySet<T extends Record<string, any>>(
    key: DataKey,
    value: T,
    context?: Record<string, any>,
  ) {
    if (!this._dataMap.has(key)) {
      await this.set(key, buildOperations({}, value), context)
      return voidFunction
    }

    if (!this._waitMap.has(key)) {
      this._waitMap.set(key, [])
    }
    const listPromise = this._waitMap.get(key)!
    const locked = !!this._lockMap.get(key) || !!listPromise.length

    const callSet = async () => {
      !locked && this._lockedMap.set(key, await this.get(key, context))
      const prev = this._lockedMap.get(key) || (await this.get(key, context))
      this._lockMap.set(key, true)
      await this.set(key, buildOperations(prev, value), context)
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
      const promise = new Promise<void>((res, rej) => {
        let tid: NodeJS.Timeout | null = null

        resolve = () => {
          tid && clearTimeout(tid)
          res()
        }

        tid = setTimeout(() => {
          rej(new Error('timeout'))
        }, 20000)
      })
      listPromise.push(async () => {
        let trying = 5
        do {
          if (!resolve) {
            trying--
            await promiseDelay(100)
            continue
          }
          resolve?.()
        } while (trying)
      })
      await promise
    }
    return await callSet()
  }

  abstract get<T extends Record<string, any>>(
    key: DataKey,
    context?: Record<string, any>,
  ): Promise<T> | T

  abstract set(
    key: DataKey,
    operations: Operation[],
    context?: Record<string, any>,
  ): Promise<void> | void

  abstract clear(key: DataKey): Promise<boolean> | boolean
}

export class MemoryProvider extends SyncProvider {
  async get<T extends Record<string, any>>(
    key: DataKey,
    context?: Record<string, any>,
  ) {
    if (!this.dataMap.has(key)) {
      this.dataMap.set(key, {} as T)
    }
    return this.dataMap.get(key) as T
  }

  async set(
    key: DataKey,
    operations: Operation[],
    context?: Record<string, any>,
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
        case 'increment':
          const oldValue = _.get(value, op.path)
          if (typeof oldValue === 'number') {
            _.set(value, op.path, oldValue + op.value)
          }
          break
      }
    })

    this.dataMap.set(key, value)
  }

  async clear(key: `${string}:${string}:${string}`) {
    return this.dataMap.delete(key)
  }
}
