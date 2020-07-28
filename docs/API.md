# API

The library exposes a function to write directly to an Azure Table Storage from your own application. The example below shows how this can be done using [pino-multi-stream](https://github.com/pinojs/pino-multi-stream).

Example:

```js
const azuretable = require('pino-azuretable')
const pinoms = require('pino-multi-stream')
// create the Azure Table Storage destination stream
const writeStream = await azuretable.createWriteStream()
// create pino loggger
const logger = pinoms({ streams: [{ stream: writeStream }] })
// log some events
logger.info('Informational message')
logger.error(new Error('things got bad'), 'error message')
```

## Functions

### createWriteStream

The `createWriteStream` function creates a writestream that `pino-multi-stream` can use to send logs to.

Example:

```js
const writeStream = await azuretable.createWriteStream({
  account: 'storageaccountname',
  key: 'storageaccountaccesskey'
})
````

#### account

Type: `String` *(optional)*

The name of the Azure Storage Account. If not specified, defaults to AZURE_STORAGE_ACCOUNT environment variable.

#### key

Type: `String` *(optional)*

The access key of the Azure Storage Account. If not specified, defaults to AZURE_STORAGE_ACCESS_KEY environment variable.

#### table

Type: `String` *(optional)*

The name of the table to storage the messages in. If not specified, defaults to `logs`.

#### partition

Type: `String` *(optional)*

The partition key to use in the table. If not specified, uses NODE_ENV environment variable, or defaults to `production`.

#### size

Type: `String` *(optional)*

The number of log messages to send as a single batch (defaults to 1).
