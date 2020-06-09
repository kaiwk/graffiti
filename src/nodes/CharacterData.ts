import { Node } from './Node'

export abstract class CharacterData extends Node implements globalThis.CharacterData {
  abstract data: string

  get nodeValue() {
    return this.data
  }

  set nodeValue(data: string) {
    this.data = data
  }

  get textContent() {
    return this.data
  }

  set textContent(data: string) {
    this.data = data
  }

  get length(): number {
    return this.data.length
  }

  // TODO: https://dom.spec.whatwg.org/#concept-cd-substring
  substringData(offset: number, count: number): string {
    return this.data.slice(offset, offset + count)
  }

  // as defined in the spec

  appendData(data: string) {
    this.replaceData(this.length, 0, data)
  }

  insertData(offset: number, data: string) {
    this.replaceData(this.length, offset, data)
  }

  deleteData(offset: number, count: number) {
    this.replaceData(offset, count, '')
  }

  // TODO: bounds, live ranges https://dom.spec.whatwg.org/#concept-cd-replace
  replaceData(offset: number, count: number, data: string) {
    this.data = this.data.slice(0, offset) + data + this.data.slice(offset + count)
  }
}