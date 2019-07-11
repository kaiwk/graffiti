import { WindowId, FfiMsg, FfiResult, Event } from "./generated";
import { Window } from "../dom/Window";
import * as ffi from './nativeApi'
import { performance } from 'perf_hooks'

export class App {
  windows: { [k: number]: Window } = {}
  animating = false
  animationFrames: Function[] = []

  constructor(private ffi) {}

  createWindow() {
    const res = this.ffi.send(FfiMsg.CreateWindow)

    const id = res.value
    const window = new Window(id)

    this.windows[id] = window

    return window
  }

  run() {
    const runLoop = () => {
      // should block if there are no events (with timeout)
      // there might be some results pending in node.js loop so we need to return back (with nothing)
      // would be great if it was possible to access this
      // somehow and only wakeup when necessary (to save cpu/power)
      // maybe we could use async_hooks to know if there was anything requested and if not,
      // just wait indefinitely

      for (const event of this.getEvents()) {
        if (event.tag === 'WindowEvent') {
          this.windows[event.value.window].handleEvent(event.value.event)
        }
      }

      if (this.animating = this.animationFrames.length > 0) {
        const timestamp = performance.now()
        const frames = this.animationFrames
        this.animationFrames = []

        for (const cb of frames) {
          cb(timestamp)
        }
      }

      // TODO: inactive windows could be throttled, maybe even stopped
      // but we should keep HMR working (update in inactive window)
      for (const windowId in this.windows) {
        this.windows[windowId].sceneContext.flush()
      }

      setTimeout(runLoop)
    }

    runLoop()
  }

  getEvents(): Event[] {
    const res = this.ffi.send(FfiMsg.GetEvents(this.animating))

    if (res.tag === 'Events') {
      return res.value
    }
  }

  requestAnimationFrame(cb) {
    this.animationFrames.push(cb)
  }
}

let APP = undefined

export function getApp({ autoCreate = true, autoRun = true } = {}): App {
  if ((APP === undefined) && autoCreate) {
    ffi.init()
    APP = new App(ffi)
    global['requestAnimationFrame'] = APP.requestAnimationFrame.bind(APP)

    if (autoRun) {
      APP.run()
    }
  }

  return APP
}