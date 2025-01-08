# Vulppi Tree Node

## Installation

```bash
npm add @vulppi/node-tree
```

## Methods & Properties

### Properties

| Name                        | Type                       | Default     |
| --------------------------- | -------------------------- | ----------- |
| [id](#id)                   | `readonly string`          | none        |
| [name](#name)               | `string`                   | `undefined` |
| [parent](#parent)           | `VulppiNode`               | `null`      |
| [prevSibling](#prevSibling) | `VulppiNode`               | `null`      |
| [nextSibling](#nextSibling) | `VulppiNode`               | `null`      |
| [flags](#flags)             | `{[key: string]: boolean}` | `{}`        |
| [properties](#properties)   | `{[key: string]: any}`     | `{}`        |

### Methods

| Name                                      | Type                                                          |
| ----------------------------------------- | ------------------------------------------------------------- |
| [destroy](#destroy)                       | `(): void`                                                    |
| [clone](#clone)                           | `(): VulppiNode`                                              |
| [getChildren](#getchildren)               | `(): VulppiNode[]`                                            |
| [addChild](#addchild)                     | `(child: VulppiNode, index?: number): void`                   |
| [getChild](#getchild)                     | `(index: number \| string \| VulppiNode): VulppiNode \| null` |
| [removeChild](#removechild)               | `(index: number \| VulppiNode): VulppiNode \| null`           |
| [addInRoot](#addinroot)                   | `(child: VulppiNode, index?: number): void`                   |
| [contains](#contains)                     | `(child: VulppiNode): boolean`                                |
| [findIndex](#findindex)                   | `(child: VulppiNode): number`                                 |
| [findChild](#findchild)                   | `(id: string): VulppiNode \| null`                            |
| [findByName](#findbyname)                 | `(name: string): VulppiNode[]`                                |
| [on](#on)                                 | `(event: string, cb: Function): void`                         |
| [off](#off)                               | `(event: string, cb: Function): Function \| null`             |
| [isEmpty](#isempty)                       | `(): boolean`                                                 |
| [isPropsEmpty](#ispropsempty)             | `(): boolean`                                                 |
| [isFlagsEmpty](#isflagsempty)             | `(): boolean`                                                 |
| [isAllEmpty](#isallempty)                 | `(): boolean`                                                 |
| [mergeToParent](#mergetoparent)           | `(): void`                                                    |
| [toObject](#toobject)                     | `(): ParsedNode`                                              |
| [toJSON](#tojson)                         | `(): string`                                                  |
| [`static` fromObject](#static-fromobject) | `(data: ParsedNode): VulppiNode`                              |
| [`static` fromJSON](#static-fromjson)     | `(data: string): VulppiNode`                                  |

### Properties Description

#### id

Unique identifier among its sibling nodes.

It's a required field in the node's constructor.

#### name

It is an optional field to find the node in the entire tree, returning a list of nodes with the same name.

#### parent

If the node has a parent, this property points to its parent. If not, the property is null.

#### nextSibling

If the node has a next sibling, this property points to its node. Otherwise the property is null.

#### prevSibling

If the node has a previous sibling, this property points to its node. Otherwise the property is null.

#### flags

This property allows receiving boolean flags.

#### properties

Location where our data is assigned.

This field can also be typed.

```ts
interface MyNodeProps {
  foo: string
}

const myNode = new VulppiNode<MyNodeProps>('my-id')

myNode.properties.foo = 'bar'
```

### Methods Description

#### destroy

This method destroys the node and removes it from the tree.

#### clone

Cleanly clone the node and all of its children.

#### getChildren

This method brings up the list of children.

#### getRoot

This method brings up the root parent.

#### addChild

Method for adding a new child to the node's child list.

If a node with the same ID is found, it will be merged with the existing node.

There is also the possibility to add the child in a specific position.

#### getChild

Retrieves a child from position or an ID.

#### removeChild

Removes a child from its position or the child's own.

#### addInRoot

This method allows you to add a node to the tree's main node list.

#### contains

Check whether the node is contained in the tree.

#### findIndex

Returns our son's position if found.

#### findChild

Finds a child node from its ID.

#### findByName

Returns a list of nodes that have the same name within the tree.

#### on

Add an event point to the node.

#### off

Remove an event point to the node.

#### isEmpty

Check if the node has any children.

#### isPropsEmpty

Check if the node has any property.

#### isFlagsEmpty

Check if the node has any flag.

#### isAllEmpty

Check that the node has no children, no properties, and no flags.

#### mergeToParent

This method allows the node to merge with its parent.

#### toObject

Converts the node to a clean object.

#### toJSON

Converts the node into a json object in string.

#### `static` fromObject

Creates a new node from an object.

#### `static` fromJSON

Creates a new node from an JSON string.
