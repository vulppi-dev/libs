import type { DataKey } from './tools'

export abstract class SyncProvider {
  abstract get<T extends {} = {}>(
    key: DataKey,
    context?: Record<string, any>,
  ): Promise<T | undefined>

  abstract set<T extends {} = {}>(
    key: DataKey,
    value: T,
    context?: Record<string, any>,
  ): Promise<boolean | undefined>

  abstract clear(key: DataKey): Promise<boolean | undefined>
}

export class MemoryProvider extends SyncProvider {
  private _dataMap = new Map<string, Record<string, any>>()

  async get<T extends {} = {}>(
    key: DataKey,
    context?: Record<string, any>,
  ): Promise<T | undefined> {
    if (!this._dataMap.has(key)) {
      this._dataMap.set(key, {} as T)
    }
    return this._dataMap.get(key) as T
  }

  async set<T extends {} = {}>(
    key: DataKey,
    value: T,
    context?: Record<string, any>,
  ): Promise<boolean | undefined> {
    this._dataMap.set(key, value)
    return true
  }

  async clear(
    key: `${string}:${string}:${string}`,
  ): Promise<boolean | undefined> {
    return this._dataMap.delete(key)
  }
}
