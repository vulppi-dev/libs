import { EventEmitter } from 'events'

type G<P = any> = Record<string | symbol, P>

export interface ParsedNode<Props extends G = G> {
  id: string
  name?: string
  props: Props
  flags: G<boolean>
  children: ParsedNode[]
}

export interface VulppiNodeEventTypes {
  'add-child': [VulppiNode, number]
  'remove-child': [VulppiNode, number]
  'change-property': [
    {
      name: string | symbol
      value: any
      oldValue: any
    },
  ]
  'change-flag': [
    {
      name: string | symbol
      value: any
      oldValue: any
    },
  ]
}

export class VulppiNode<
  Props extends G = G,
> extends EventEmitter<VulppiNodeEventTypes> {
  private _id: string
  private _parent: VulppiNode | null = null
  private _prevSibling: VulppiNode | null = null
  private _nextSibling: VulppiNode | null = null
  private _children: VulppiNode[]
  private _properties: Props
  private _flags: G<boolean>

  private _pProperties: G
  private _pFlags: G<boolean>

  /**
   * It is an optional field to find the node in the entire tree, returning a list of nodes with the same name.
   */
  name?: string

  constructor(options: { id: string; name?: string }) {
    super()

    this._id = options.id
    this.name = options.name

    this._children = []
    this._properties = {} as Props
    this._flags = {}
    this._pProperties = new Proxy(this._properties, {
      get: (target, name) => {
        return target[name]
      },
      set: (target: any, name, value) => {
        this.emit('change-property', {
          name,
          value,
          oldValue: target[name],
        })
        target[name] = value
        return true
      },
    })
    this._pFlags = new Proxy(this._flags, {
      get: (target, name) => {
        return target[name]
      },
      set: (target, name, value) => {
        this.emit('change-flag', {
          name,
          value,
          oldValue: target[name],
        })
        target[name] = value
        return true
      },
    })
  }

  /**
   * Unique identifier among its sibling nodes.
   * It's a required field in the node's constructor.
   */
  get id() {
    return this._id
  }

  /**
   * If the node has a parent, this property points to its parent. If not, the property is null.
   */
  get parent() {
    return this._parent
  }

  /**
   * If the node has a next sibling, this property points to its node. Otherwise the property is null.
   */
  get nextSibling() {
    return this._nextSibling
  }

  /**
   * If the node has a previous sibling, this property points to its node. Otherwise the property is null.
   */
  get prevSibling() {
    return this._prevSibling
  }

  /**
   * This property allows receiving boolean flags.
   */
  get flags() {
    return this._pFlags
  }

  /**
   * Location where our data is assigned.
   *
   * This field can also be typed.
   *
   * ```ts
   * interface MyNodeProps {
   *   foo: string
   * }
   *
   * const myNode = new VulppiNode<MyNodeProps>('my-id')
   *
   * myNode.properties.foo = 'bar'
   * ```
   */
  get properties() {
    return this._pProperties
  }

  /**
   * This method destroys the node and removes it from the tree.
   */
  destroy() {
    this._parent?.removeChild(this)
  }

  /**
   * Cleanly clone the node and all of its children.
   */
  clone() {
    const clone = new VulppiNode({ id: this.id })
    clone.name = this.name
    for (const k in this._properties) {
      clone._properties[k] = this._properties[k]
    }
    for (const k in this._flags) {
      clone._flags[k] = this._flags[k]
    }
    clone._children = this._children.map((c) => c.clone())
    return clone
  }

  /**
   * This method brings up the list of children.
   */
  getChildren() {
    return [...this._children]
  }

  /**
   * This method brings up the root parent.
   */
  getRoot() {
    let parent = this._parent
    while (parent?.parent) {
      parent = parent.parent
    }
    return parent
  }

  /**
   * Method for adding a new child to the node's child list.
   * If a node with the same ID is found, it will be merged with the existing node.
   * There is also the possibility to add the child in a specific position.
   */
  addChild(child: VulppiNode, index = -1) {
    if (child._parent)
      throw new Error(
        'This node is already in a tree.\nIf you want an addition, first revoke the tree.',
      )

    if (this.getRoot()?.findChild(child.id))
      throw new Error('There is already a com with the same id in the tree.')

    if (this.getRoot()?.id === child.id)
      throw new Error('You cannot add the root within the tree itself.')

    const same = this._children.find((c) => c._id === child._id)

    if (!same) {
      child._parent = this
      if (index >= 0) {
        this._children.splice(index, 0, child)
        const prevNode = this._children[index - 1] || null
        const nextNode = this._children[index + 1] || null
        child._prevSibling = prevNode
        child._nextSibling = nextNode
        prevNode._nextSibling = child
        nextNode._prevSibling = child
      } else {
        const prevNode = this._children[this._children.length - 1] || null
        child._prevSibling = prevNode
        this._children.push(child)
      }
    } else {
      for (const k in child._properties) {
        same._properties[k] = child._properties[k]
      }
      for (const k in child._flags) {
        same._flags[k] = child._flags[k]
      }
      child._children.forEach((c) => same.addChild(c))
    }

    this.emit(
      'add-child',
      same || child,
      same
        ? this.findIndex(same)
        : index >= 0
        ? index
        : this._children.length - 1,
    )
  }

  /**
   * Retrieves a child from position or an ID.
   */
  getChild(index: number | string) {
    if (typeof index === 'number') {
      return this._children[index] || null
    } else {
      return this._children.find((c) => c._id === index) || null
    }
  }

  /**
   * Removes a child from its position or the child's own.
   */
  removeChild(index: number | VulppiNode): VulppiNode | null {
    let c: VulppiNode | null = null
    let i: number = 0
    if (typeof index === 'number') {
      c = this._children.splice(index, 1)[0] || null
      i = index
    } else {
      i = this.findIndex(index)
      if (i < 0) throw new Error('The node is not a child of this node')

      this.emit('remove-child', index, i)
      index._parent = null
      c = this._children.splice(i, 1)[0] || null
    }

    if (c) {
      c._parent = null
      const pn = c.prevSibling
      const nn = c.nextSibling

      if (pn && nn) {
        c._prevSibling = null
        c._nextSibling = null
        pn._nextSibling = nn
        nn._prevSibling = pn
      } else if (pn) {
        pn._nextSibling = null
      } else if (nn) {
        nn._nextSibling = null
      }

      this.emit('remove-child', c, i)
    }
    return c
  }

  /**
   * This method allows you to add a node to the tree's main node list.
   */
  addInRoot(child: VulppiNode, index = -1) {
    const parent = this.getRoot()
    if (!parent) {
      this.addChild(child, index)
    } else {
      parent.addChild(child, index)
    }
  }

  /**
   * Check whether the node is contained in the tree.
   */
  contains(child: VulppiNode): boolean {
    return this._children.some((c) => c.id === child.id || c.contains(child))
  }

  /**
   * Returns our son's position if found.
   */
  findIndex(child: string | VulppiNode) {
    const id = typeof child === 'string' ? child : child._id
    return this._children.findIndex((c) => c._id === id)
  }

  /**
   * Finds a child node from its ID.
   */
  findChild(id: string): VulppiNode | null {
    for (const k in this._children) {
      const c = this._children[k]
      if (c.id === id) return c

      const cc = c.findChild(id)
      if (cc) return cc
    }
    return null
  }

  /**
   * Returns a list of nodes that have the same name within the tree.
   */
  findByName(name: string): VulppiNode[] {
    const buffer: VulppiNode[] = []

    for (const k in this._children) {
      const c = this._children[k]
      if (c.name === name) buffer.push(c)
      const cc = c.findByName(name)
      buffer.push(...cc)
    }

    return buffer
  }

  /**
   * Check if the node has any children.
   */
  isEmpty() {
    return !this._children.length
  }

  /**
   * Check if the node has any property.
   */
  isPropsEmpty() {
    return !Object.keys(this._properties).length
  }

  /**
   * Check if the node has any flag.
   */
  isFlagsEmpty() {
    return !Object.keys(this._flags).length
  }

  /**
   * Check that the node has no children, no properties, and no flags.
   */
  isAllEmpty() {
    return this.isEmpty() && this.isPropsEmpty() && this.isFlagsEmpty()
  }

  /**
   * This method allows the node to merge with its parent.
   */
  mergeToParent() {
    if (!this._parent) return
    for (const k in this._properties) {
      this._parent._properties[k] = this._properties[k]
    }
    for (const k in this._flags) {
      this._parent._flags[k] = this._flags[k]
    }
    this._children.forEach((c) => this._parent?.addChild(c))
    this.destroy()
  }

  /**
   * Converts the node to a clean object.
   */
  toObject(): ParsedNode<Props> {
    const props: Props = { ...this._properties }
    const flags: G<boolean> = { ...this._flags }
    const children = this._children.map((c) => {
      return c.toObject()
    })
    return {
      id: this.id,
      name: this.name,
      props,
      flags,
      children,
    }
  }

  /**
   * Converts the node into a json object in string.
   */
  toJSON(prettier = true) {
    if (prettier) {
      JSON.stringify(this.toObject(), null, 2)
    }
    return JSON.stringify(this.toObject())
  }

  toString() {
    return this.toJSON(true)
  }

  /**
   * Creates a new node from an object.
   */
  static fromObject(data: ParsedNode) {
    if (!('id' in data)) return

    const node = new VulppiNode({ id: data.id })
    node.name = data.name
    Object.assign(node._properties, data.props || {})
    Object.assign(node._flags, data.flags || {})
    const children = data.children?.map((c) => VulppiNode.fromObject(c)) || []
    children.forEach((c) => {
      c && node.addChild(c)
    })

    return node
  }

  /**
   * Creates a new node from an JSON string.
   */
  static fromJSON(data: string) {
    return VulppiNode.fromObject(JSON.parse(data))
  }
}
