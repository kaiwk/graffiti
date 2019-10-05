import { send } from './nativeApi'

/**
 * Provides indirect mutation api for the scene, so that we can freely change an
 * actual message format in the future
 *
 * Operations are batched and not sent until the `flush()` is called
 */
export class SceneContext {
  // because root is 0
  nextId = 1
  msg = new UpdateSceneMsg()
  parents = []

  constructor(private windowId) {}

  createSurface() {
    this.msg.tree_changes.push({})
    this.parents[this.nextId] = 0
    return this.nextId++
  }

  insertAt(parent, child, index) {
    this.msg.tree_changes.push({ parent, child, index })
    this.parents[child] = parent
  }

  removeChild(parent, child) {
    this.msg.tree_changes.push({ parent, child })
    this.parents[child] = 0
  }

  setText(surface, text) {
    this.msg.text_changes.push({ surface, text })
  }

  setDimension(surface, prop, dim) {
    this.msg.layout_changes.push({ surface, dim_prop: prop, dim })
  }

  setAlign(surface, prop, align) {
    this.msg.layout_changes.push({ surface, align_prop: prop, align })
  }

  flush() {
    if (this.msg.empty) {
      console.log('no updates')
      return
    }

    send({
      window: this.windowId,
      update: this.msg
    })

    this.msg = new UpdateSceneMsg()
  }
}

class UpdateSceneMsg {
  tree_changes = []
  text_changes = []
  layout_changes = []

  get empty() {
    return ! (this.tree_changes.length || this.text_changes.length)
  }
}

