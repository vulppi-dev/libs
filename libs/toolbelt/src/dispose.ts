export async function using<S extends () => any>(
  start: S,
  end: () => void | Promise<void>,
  error?: (err: any) => void | Promise<void>,
): Promise<ReturnType<S>> {
  try {
    return await start()
  } catch (err: any) {
    if (error) {
      await error(err)
    }
    throw err
  } finally {
    await end()
  }
}
