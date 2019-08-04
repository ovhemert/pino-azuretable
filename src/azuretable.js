'use strict'

const azure = require('azure-storage')
const os = require('os')
const util = require('util')
const stream = require('stream')
const through2 = require('through2')

class Client {
  constructor (options = {}) {
    this.accountName = options.account || process.env.AZURE_STORAGE_ACCOUNT
    this.accountKey = options.key || process.env.AZURE_STORAGE_ACCESS_KEY
    this.tableName = options.table || 'logs'
    this.partitionKey = options.partition || process.env.NODE_ENV || 'production'
  }

  createEntity (log) {
    const EG = azure.TableUtilities.entityGenerator

    const data = Object.assign({}, log)
    const PartitionKey = EG.String(this.partitionKey)
    const RowKey = EG.String(new Date().getTime().toString())
    const hostname = EG.String(data.hostname || os.hostname()); delete data.hostname
    const pid = EG.Int32(data.pid || process.pid); delete data.pid
    const level = EG.String(data.level); delete data.level
    const msg = EG.String(data.msg); delete data.msg
    const time = (data.time) ? new Date(data.time) : new Date(); delete data.time
    const meta = EG.String(JSON.stringify(data))
    const entity = { PartitionKey, RowKey, hostname, pid, level, msg, time, meta }
    return entity
  }

  get tableService () {
    if (!this._tableService) {
      this._tableService = azure.createTableService(this.accountName, this.accountKey)
      this._tableService.executeBatchAsync = util.promisify(this._tableService.executeBatch)
      this._tableService.createTableIfNotExistsAsync = util.promisify(this._tableService.createTableIfNotExists)
    }
    return this._tableService
  }

  async insert (entities = []) {
    const self = this
    const data = Array.isArray(entities) ? entities : [entities]
    if (data.length <= 0) { return }
    try {
      const batch = new azure.TableBatch()
      data.forEach((entity) => batch.insertOrReplaceEntity(entity))
      const result = await self.tableService.executeBatchAsync(self.tableName, batch)
      return result
    } catch (err) {
      throw Error(err.message)
    }
  }

  insertStream () {
    const self = this
    const writeStream = new stream.Writable({ objectMode: true, highWaterMark: 1 })
    writeStream._write = function (chunk, encoding, callback) {
      self.insert(chunk).then(() => { callback(null) }).catch(callback)
    }
    return writeStream
  }

  transformEntityStream (transform) {
    const self = this
    return through2.obj(function transport (chunk, enc, cb) {
      const entry = self.createEntity(chunk)
      cb(null, entry)
    })
  }

  validate () {
    const tableService = this.tableService
    return tableService.createTableIfNotExistsAsync(this.tableName)
  }
}

module.exports = { Client }
