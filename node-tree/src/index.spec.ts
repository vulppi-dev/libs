/// <reference types="mocha" />

import { VulppiNode } from './index.js'
import { expect } from 'chai'

describe('VulppiNode', () => {
  it('should create a new VulppiNode instance', () => {
    const node = new VulppiNode({ id: 'root' })
    expect(node).to.be.an.instanceOf(VulppiNode)
    expect(node.id).to.equal('root')
    expect(node.getChildren()).to.be.an('array').that.is.empty
  })

  it('should add a child node', () => {
    const parent = new VulppiNode({ id: 'parent' })
    const child = new VulppiNode({ id: 'child' })
    parent.addChild(child)
    expect(parent.getChildren()).to.have.lengthOf(1)
    expect(parent.getChildren()[0]).to.equal(child)
    expect(child.parent).to.equal(parent)
  })

  it('should remove a child node', () => {
    const parent = new VulppiNode({ id: 'parent' })
    const child = new VulppiNode({ id: 'child' })
    parent.addChild(child)
    parent.removeChild(child)
    expect(parent.getChildren()).to.be.an('array').that.is.empty
    expect(child.parent).to.be.null
  })

  it('should throw an error when removing a child that is not a direct child', () => {
    const parent1 = new VulppiNode({ id: 'parent1' })
    const parent2 = new VulppiNode({ id: 'parent2' })
    const child = new VulppiNode({ id: 'child' })
    parent1.addChild(child)
    expect(() => parent2.removeChild(child)).to.throw(
      Error,
      'The node is not a child of this node',
    )
  })
})
