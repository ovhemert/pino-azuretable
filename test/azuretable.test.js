'use strict'

let azure = require('azure-storage')
const test = require('tap').test
const tested = require('../src/azuretable')
const sinon = require('sinon')

function stubAzureTableService () {
  const stub = sinon.stub(azure, 'createTableService').callsFake(() => {
    return {
      createTableIfNotExists: function (table, callback) {
        return callback()
      },
      executeBatch: function (table, batch, callback) {
        return callback(null, batch)
      }
    }
  })
  return stub
}

test('creates client', t => {
  const client = new tested.Client()
  t.ok(client.hasOwnProperty('accountName'))
  t.ok(client.hasOwnProperty('accountKey'))
  t.ok(client.hasOwnProperty('tableName'))
  t.ok(client.hasOwnProperty('partitionKey'))
  t.end()
})

test('creates table service', t => {
  let stubTS = stubAzureTableService()
  const client = new tested.Client()
  try {
    t.ok(client.tableService)
    t.ok(client.tableService) // from cache
  } finally {
    stubTS.restore()
    t.end()
  }
})

test('validates table exists', async t => {
  let stubTS = stubAzureTableService()
  const client = new tested.Client()
  const validate = client.validate()
  try {
    await t.resolves(validate)
  } finally {
    stubTS.restore()
    t.end()
  }
})

test('calls insert without document', t => {
  let client = new tested.Client()
  client.insert().then(data => {
    t.equals(data, undefined)
    t.end()
  })
})

test('creates table entity', t => {
  let client = new tested.Client()
  const log = { 'level': 30, 'time': 1553862903459, 'pid': 23164, 'hostname': 'Osmonds-MacBook-Pro.local', 'msg': 'info message', 'v': 1 }
  const entity = client.createEntity(log)
  t.ok(entity.PartitionKey)
  t.ok(entity.RowKey)
  t.ok(entity.hostname)
  t.ok(entity.pid)
  t.ok(entity.level)
  t.ok(entity.msg)
  t.ok(entity.time)
  t.ok(entity.meta)
  t.end()
})

test('creates table entity with missing properties', t => {
  let client = new tested.Client()
  const log = { 'level': 30, 'msg': 'info message', 'v': 1 }
  const entity = client.createEntity(log)
  t.ok(entity.PartitionKey)
  t.ok(entity.RowKey)
  t.ok(entity.hostname)
  t.ok(entity.pid)
  t.ok(entity.level)
  t.ok(entity.msg)
  t.ok(entity.time)
  t.ok(entity.meta)
  t.end()
})

test('errors on failed insert', async t => {
  let stubTS = stubAzureTableService()
  stubTS.executeBatch = function (table, batch, callback) {
    return callback(Error('Something went wrong'))
  }
  let client = new tested.Client()
  const insert = client.insert({ message: 'crazy invalid document' })
  try {
    await t.rejects(insert)
  } finally {
    stubTS.restore()
    t.end()
  }
})

test('inserts single document', t => {
  let stubTS = stubAzureTableService()
  let client = new tested.Client()
  const log = { 'level': 30, 'time': 1553862903459, 'pid': 23164, 'hostname': 'Osmonds-MacBook-Pro.local', 'msg': 'info message', 'v': 1 }
  const entity = client.createEntity(log)
  client.insert(entity).then(data => {
    t.equals(data.operations.length, 1)
    t.equals(data.operations[0].type, 'INSERT_OR_REPLACE')
    stubTS.restore()
    t.end()
  })
})

test('inserts multiple documents', t => {
  let stubTS = stubAzureTableService()
  let client = new tested.Client()
  const log = { 'level': 30, 'time': 1553862903459, 'pid': 23164, 'hostname': 'Osmonds-MacBook-Pro.local', 'msg': 'info message', 'v': 1 }
  const entity = client.createEntity(log)
  const entities = [1, 2, 3, 4, 5].map(i => { return entity })
  client.insert(entities).then(data => {
    t.equals(data.operations.length, 5)
    for (let i = 0; i < 5; i++) { t.equals(data.operations[i].type, 'INSERT_OR_REPLACE') }
    stubTS.restore()
    t.end()
  })
})

test('inserts with write stream', t => {
  let stubTS = stubAzureTableService()
  let client = new tested.Client()
  const log = { 'level': 30, 'time': 1553862903459, 'pid': 23164, 'hostname': 'Osmonds-MacBook-Pro.local', 'msg': 'info message', 'v': 1 }
  const entity = client.createEntity(log)
  let ws = client.insertStream()
  ws.write(entity)
  ws.end()
  t.ok(stubTS.called)
  stubTS.restore()
  t.end()
})

test('transforms pino log messages', t => {
  let client = new tested.Client()
  const writeStream = client.transformEntityStream()
  let output = []
  const logs = [
    { 'level': 10, 'time': 1532081790710, 'msg': 'trace message', 'pid': 9118, 'hostname': 'Osmonds-MacBook-Pro.local', 'v': 1 },
    { 'level': 20, 'time': 1532081790720, 'msg': 'debug message', 'pid': 9118, 'hostname': 'Osmonds-MacBook-Pro.local', 'v': 1 },
    { 'level': 30, 'time': 1532081790730, 'msg': 'info message', 'pid': 9118, 'hostname': 'Osmonds-MacBook-Pro.local', 'v': 1 },
    { 'level': 40, 'time': 1532081790740, 'msg': 'warning message', 'pid': 9118, 'hostname': 'Osmonds-MacBook-Pro.local', 'v': 1 },
    { 'level': 50, 'time': 1532081790750, 'msg': 'error message', 'pid': 9118, 'hostname': 'Osmonds-MacBook-Pro.local', 'type': 'Error', 'stack': 'Error: error message', 'v': 1 },
    { 'level': 60, 'time': 1532081790760, 'msg': 'fatal message', 'pid': 9118, 'hostname': 'Osmonds-MacBook-Pro.local', 'v': 1 },
    { 'level': 30, 'pid': 9118, 'ddsource': 'test', 'service': 'myservice', 'tags': { 'foo': 'bar' }, 'v': 1 }
  ]
  writeStream.on('data', chunk => {
    output.push(chunk)
  }).on('end', () => {
    t.equal(output[0].level._, 10)
    t.equal(output[1].level._, 20)
    t.equal(output[2].level._, 30)
    t.equal(output[3].level._, 40)
    t.equal(output[4].level._, 50)
    t.equal(output[5].level._, 60)
    t.end()
  })
  logs.forEach(log => writeStream.write(log))
  writeStream.end()
})
