export abstract class Robot {
  protected static spyKey = 'chrome-extension-post-robot-spy'
  private static content: Robot | null
  private static inject: Robot | null
  private static background: Robot | null

  static get<T extends Robot>(): T {
    if (
      typeof window !== 'undefined' &&
      typeof chrome?.runtime !== 'undefined'
    ) {
      Robot.content = Robot.content || new ContentRobot()
      return Robot.content as T
    } else if (typeof window !== 'undefined') {
      Robot.inject = Robot.inject || new InjectRobot()
      return Robot.inject as T
    } else if (typeof chrome?.runtime !== 'undefined') {
      Robot.background = Robot.background || new BackgroundRobot()
      return Robot.background as T
    }
    throw new Error('Robot determine type error')
  }

  protected listeners: Array<ContentRobotListener> = []

  on(
    eventName: string,
    callback: { (event: CustomEvent): unknown },
    once = false,
  ) {
    this.listeners.push({
      eventName,
      callback,
      once,
    })
  }

  abstract send(evenName: string, payload?: unknown): void
}

interface ContentRobotListener {
  eventName: string
  callback: { (event: CustomEvent): unknown }
  once?: boolean
}

export class ContentRobot extends Robot {
  private spy: HTMLElement | null = null

  constructor() {
    super()
    this.init()
  }

  init() {
    let div = document.getElementById(Robot.spyKey)
    if (div) {
      this.spy = div
      return
    }
    div = document.createElement('div')
    div.style.cssText = `opacity: 0; width: 0; height: 0; z-index: -999; pointer-events: none; position: fixed; left: -99999px; margin: 0; padding: 0;`
    div.id = Robot.spyKey
    document.body.appendChild(div)
    this.spy = div

    window.addEventListener('message', this.handleMessage)
  }

  private handleMessage = (
    event: MessageEvent<{
      type: string
      payload: unknown
    }>,
  ) => {
    if (event.source !== window) return
    const { type, payload } = event.data
    const callbackEvent = new CustomEvent(type, {
      detail: payload,
    })

    const listeners: Array<ContentRobotListener> = []

    this.listeners.forEach((listener) => {
      if (!listener.once || listener.eventName !== type) {
        listeners.push(listener)
      }
      if (listener.eventName === type) {
        listener.callback(callbackEvent)
      }
    })

    this.listeners = listeners
  }

  send(eventName: string, payload?: unknown) {
    if (this.spy) {
      const customEvent = new CustomEvent(eventName, {
        detail: payload,
      })

      this.spy.dispatchEvent(customEvent)
    }
    chrome.runtime.sendMessage({
      action: eventName,
      payload,
    })
  }
}

class InjectRobot extends Robot {
  private spy: HTMLElement | null = null

  constructor() {
    super()
    this.init()
  }

  init() {
    const div = document.getElementById(Robot.spyKey)
    if (div) {
      this.spy = div
      return
    }
    console.log(this.spy)
  }

  on(
    eventName: string,
    callback: { (event: CustomEvent): unknown },
    once = false,
  ) {
    if (!this.spy) {
      throw new Error('Determine spy error')
    }
    this.spy.addEventListener(
      eventName,
      (e: Event) => {
        callback(e as unknown as CustomEvent)
      },
      { once },
    )
  }

  send(eventName: string, payload?: unknown) {
    window.postMessage({
      type: eventName,
      payload,
    })
  }
}

class BackgroundRobot extends Robot {
  constructor() {
    super()
    this.init()
  }

  init() {
    chrome.runtime.onMessage.addListener(async (message) => {
      const { action, payload } = message as {
        action: string
        payload: unknown
      }

      const callbackEvent = new CustomEvent(action, {
        detail: payload,
      })

      const listeners: Array<ContentRobotListener> = []

      this.listeners.forEach((listener) => {
        if (!listener.once || listener.eventName !== action) {
          listeners.push(listener)
        }
        if (listener.eventName === action) {
          listener.callback(callbackEvent)
        }
      })

      this.listeners = listeners
    })
  }

  send() {}
}
