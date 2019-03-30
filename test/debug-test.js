'use strict'

const azuretable = require('../src/azuretable')

async function main () {
  const apiKey = process.env.DD_API_KEY
  const client = new azuretable.Client({ apiKey })

  await client.validate()

  const log = { 'level': 30, 'time': 1553862903459, 'pid': 23164, 'hostname': 'Osmonds-MacBook-Pro.local', 'msg': 'info message', 'v': 1 }
  const data = client.createEntity(log)
  await client.insert(data)
}

main()
