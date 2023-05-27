export abstract class SyncProvider {
  abstract get<T extends {} = {}>(
    key: string,
    scope?: Record<string, any>,
  ): Promise<T | undefined>
  abstract set<T extends {} = {}>(
    key: string,
    value: T,
    scope?: Record<string, any>,
  ): Promise<boolean | undefined>
}
