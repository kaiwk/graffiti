// x nodes should not directly depend on native
// x follow spec as possible incl. mixins, avoid custom extensions

import * as assert from 'assert'

import { EventTarget } from '../events/EventTarget'
import { Document } from './Document'
import { NodeList } from './NodeList'
import { last, UNSUPPORTED, applyMixin } from '../util'

abstract class Node extends EventTarget implements G.Node {
  abstract readonly nodeType: number
  abstract readonly nodeName: string
  abstract readonly childNodes: NodeList<G.ChildNode>
  readonly parentNode: Element | null = null

  // nodes should only be created by document
  protected constructor(public readonly ownerDocument: Document) {
    super()
  }

  appendChild<T extends G.Node>(child: T): T {
    return this.insertBefore(child, null)
  }

  insertBefore<T extends G.Node>(child: T, refNode: G.Node | null): T {
    // should be !== null but some libs pass undefined too
    if (refNode) {
      assert.equal(refNode.parentNode, this)
    }

    // fragment
    if (child.nodeType === DOCUMENT_FRAGMENT_NODE) {
      child.childNodes.splice(0).forEach(c => this.insertBefore(c, refNode))
      return child
    }

    // remove first (in case it was in the same element already)
    ;(child as any).remove()

    this._insertChildAt(child as any, refNode ? this.childNodes.indexOf(refNode) : this.childNodes.length)
    ;(child as any).parentNode = this

    return child
  }

  // overridden by Document & Element
  _insertChildAt(child: Node, index: number) {
    this.childNodes.splice(index, 0, child)
  }

  // overridden by Element
  removeChild<T extends G.Node>(child: T): T {
    assert.equal(child.parentNode, this)

    ;(child as any).parentNode = null
    this.childNodes.splice(this.childNodes.indexOf(child), 1)

    return child
  }

  replaceChild<T extends G.Node>(child: G.Node, oldChild: T): T {
    this.insertBefore(child, oldChild)

    return this.removeChild(oldChild)
  }

  hasChildNodes(): boolean {
    return this.childNodes.length !== 0
  }

  get firstChild(): G.ChildNode | null {
    return this.childNodes[0] ?? null
  }

  get lastChild(): G.ChildNode | null {
    return last(this.childNodes) ?? null
  }

  get parentElement(): HTMLElement | null {
    return this.parentNode as HTMLElement
  }

  get nextSibling(): G.ChildNode | null {
    return sibling(this.parentNode, this, 1)
  }

  get previousSibling(): G.ChildNode | null {
    return sibling(this.parentNode, this, -1)
  }

  // https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeValue
  // overridden by CharacterData
  get nodeValue(): string | null {
    return null
  }

  // overridden by CharacterData
  // comment.textContent should return a value but it
  // shouldn't be part of element.textContent
  get textContent(): string | null {
    return this.childNodes
      .filter(c => c.nodeType == ELEMENT_NODE || c.nodeType == TEXT_NODE)
      .map(c => c.textContent)
      .join('')
  }

  // overridden by CharacterData
  set textContent(v) {
    this.childNodes.forEach(c => c.remove())

    // note we can't just update already present text node because it has to remain untouched
    this.appendChild(this.ownerDocument.createTextNode('' + v))
  }

  getRootNode(options?: GetRootNodeOptions): G.Node {
    return this.ownerDocument
  }

  isSameNode(node): boolean {
    return node === this
  }

  get baseURI(): string {
    return this.ownerDocument.location.href
  }

  get namespaceURI(): string | null {
    return 'http://www.w3.org/1999/xhtml'
  }

  lookupNamespaceURI(prefix: string | null): string | null {
    return null
  }

  lookupPrefix(namespace: string | null): string | null {
    return null
  }

  isDefaultNamespace(namespace: string | null): boolean {
    return false
  }

  normalize() {
    UNSUPPORTED()
  }

  get isConnected(): boolean {
    return this.parentNode?.isConnected ?? false
  }

  isEqualNode(otherNode: G.Node | null): boolean {
    return UNSUPPORTED()
  }

  cloneNode(deep?: boolean): G.Node {
    return UNSUPPORTED()
  }

  compareDocumentPosition(other: G.Node): number {
    return UNSUPPORTED()
  }

  contains(other: G.Node | null): boolean {
    return UNSUPPORTED()
  }

  // node types
  static readonly ELEMENT_NODE = 1
  static readonly ATTRIBUTE_NODE = 2
  static readonly TEXT_NODE = 3
  static readonly CDATA_SECTION_NODE = 4
  static readonly ENTITY_REFERENCE_NODE = 5
  static readonly ENTITY_NODE = 6
  static readonly PROCESSING_INSTRUCTION_NODE = 7
  static readonly COMMENT_NODE = 8
  static readonly DOCUMENT_NODE = 9
  static readonly DOCUMENT_TYPE_NODE = 10
  static readonly DOCUMENT_FRAGMENT_NODE = 11
  static readonly NOTATION_NODE = 12

  // types again (instance)
  // (getters are defined on prototype so they don't consume instance space)
  get ELEMENT_NODE(): number { return Node.ELEMENT_NODE }
  get ATTRIBUTE_NODE(): number { return Node.ATTRIBUTE_NODE }
  get TEXT_NODE(): number { return Node.TEXT_NODE }
  get CDATA_SECTION_NODE(): number { return Node.CDATA_SECTION_NODE }
  get ENTITY_REFERENCE_NODE(): number { return Node.ENTITY_REFERENCE_NODE }
  get ENTITY_NODE(): number { return Node.ENTITY_NODE }
  get PROCESSING_INSTRUCTION_NODE(): number { return Node.PROCESSING_INSTRUCTION_NODE }
  get COMMENT_NODE(): number { return Node.COMMENT_NODE }
  get DOCUMENT_NODE(): number { return Node.DOCUMENT_NODE }
  get DOCUMENT_TYPE_NODE(): number { return Node.DOCUMENT_TYPE_NODE }
  get DOCUMENT_FRAGMENT_NODE(): number { return Node.DOCUMENT_FRAGMENT_NODE }
  get NOTATION_NODE(): number { return Node.NOTATION_NODE }

  // maybe later
  DOCUMENT_POSITION_CONTAINED_BY
  DOCUMENT_POSITION_CONTAINS
  DOCUMENT_POSITION_DISCONNECTED
  DOCUMENT_POSITION_FOLLOWING
  DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC
  DOCUMENT_POSITION_PRECEDING
}

abstract class ParentNode extends Node implements G.ParentNode {
  get children(): HTMLCollection {
    // TODO: HTMLCollection
    return this.childNodes.filter(c => c.nodeType === ELEMENT_NODE) as any
  }

  get childElementCount(): number {
    return this.children.length
  }

  get firstElementChild(): Element | null {
    return this.children[0] ?? null
  }

  get lastElementChild(): Element | null {
    return last(this.children) ?? null
  }

  append(...nodes: (G.Node | string)[]) {
    nodes.forEach(n => this.appendChild(strToNode(this, n)))
  }

  prepend(...nodes: (G.Node | string)[]) {
    nodes.forEach(n => this.insertBefore(strToNode(this, n), this.firstChild))
  }

  querySelector(selectors) {
    return this.ownerDocument.querySelector(selectors, this)
  }

  querySelectorAll(selectors) {
    return this.ownerDocument.querySelectorAll(selectors, this)
  }
}

abstract class ChildNode extends Node implements G.ChildNode {
  after(...nodes: (G.Node | string)[]) {
    const refNode = this.nextSibling

    if (this.parentNode) {
      nodes.forEach(n => this.parentNode!.insertBefore(strToNode(this, n), refNode))
    }
  }

  before(...nodes: (G.Node | string)[]) {
    if (this.parentNode) {
      nodes.forEach(n => this.parentNode!.insertBefore(strToNode(this, n), this))
    }
  }

  replaceWith(...nodes: (G.Node | string)[]) {
    this.before(...nodes)
    this.remove()
  }

  remove() {
    if (this.parentNode) {
      this.parentNode.removeChild(this)
    }
  }
}

abstract class NonDocumentTypeChildNode extends Node implements G.NonDocumentTypeChildNode {
  // TODO
  nextElementSibling
  previousElementSibling
}


// apply mixins & tell TS about it
// we do this to reduce code-duplication in most of all subclasses
// we could mix them manually in each subclass but it's hard to tell TS about it
// then (without any intermediate anonymous classes)
//
// simple typeof Node & ... didnt work so we define union type first and then
// define impl as constructor which returns that type but also impl. that type
// because of statics
;[ParentNode, ChildNode, NonDocumentTypeChildNode].forEach(Mixin => applyMixin(Node, Mixin))
type NodeType = G.Node & G.ParentNode & G.ChildNode & G.NonDocumentTypeChildNode & G.Slotable
const NodeImpl: (new (Document) => Node & NodeType) & NodeType = Node as any

// export as `Node` (name)
export { NodeImpl as Node }

// perf(const vs. property lookup)
const ELEMENT_NODE = Node.ELEMENT_NODE
const TEXT_NODE = Node.TEXT_NODE
const COMMENT_NODE = Node.COMMENT_NODE
const DOCUMENT_NODE = Node.DOCUMENT_NODE
const DOCUMENT_FRAGMENT_NODE = Node.DOCUMENT_FRAGMENT_NODE

const sibling = (parent, child, offset) =>
  parent && (parent.childNodes[parent.childNodes.indexOf(child) + offset] ?? null)

const strToNode = (parent, n) => (typeof n === 'string' ? parent.ownerDocument.createTextNode('' + n) : n)

// shorthands for globalThis.*
namespace G {
  export type Node = globalThis.Node
  export type ChildNode = globalThis.ChildNode
  export type NonDocumentTypeChildNode = globalThis.NonDocumentTypeChildNode
  export type ParentNode = globalThis.ParentNode
  export type Slotable = globalThis.Slotable
}