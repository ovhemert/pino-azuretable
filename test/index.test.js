'use strict'

let azuretable = require('../src/azuretable')
const test = require('tap').test
const tested = require('../src/index')
const sinon = require('sinon')

test('creates write stream', t => {
  const stub = sinon.stub(azuretable.Client.prototype, 'validate').resolves()
  tested.createWriteStream().then(writeStream => {
    t.ok(writeStream.writable)
    stub.restore()
    t.end()
  }).catch(err => {
    t.fail(err.message)
    stub.restore()
    t.end()
  })
})
