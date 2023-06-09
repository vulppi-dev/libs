export class TimeoutHandler {
  private _timeout: number
  private _timeoutHandler: NodeJS.Timeout | null = null
  private _timeoutCallback: () => void

  constructor(timeout: number, callback: () => void) {
    this._timeout = timeout
    this._timeoutCallback = callback
  }

  public start() {
    this.restart()
  }

  public restart(duration: number = 0) {
    this.stop()
    if (duration > 0) this._timeout = duration
    this._timeoutHandler = setTimeout(this._timeoutCallback, this._timeout)
  }

  public stop() {
    if (this._timeoutHandler) {
      clearTimeout(this._timeoutHandler)
      this._timeoutHandler = null
    }
  }

  public destroy() {
    this.stop()
  }
}
