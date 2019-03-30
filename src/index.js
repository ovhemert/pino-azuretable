'use strict'

const azuretable = require('./azuretable')
const streams = require('./streams')
const pumpify = require('pumpify')

async function createWriteStream (options = {}) {
  const { size = 1 } = options

  const client = new azuretable.Client(options)
  await client.validate()

  const parseJsonStream = streams.parseJsonStream()
  const transformEntityStream = client.transformEntityStream()
  const batchStream = streams.batchStream(size)

  const writeStream = client.insertStream()

  return pumpify(parseJsonStream, transformEntityStream, batchStream, writeStream)
}

module.exports.createWriteStream = createWriteStream
