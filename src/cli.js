#!/usr/bin/env node

const program = require('commander')

const pkg = require('../package.json')
const pinoAzureTable = require('././index')

// main cli logic
function main () {
  program
    .version(pkg.version)
    .option('-a, --account <account>', 'Storage account name')
    .option('-k, --key <key>', 'Storage account key')
    .option('-t, --table <table>', 'Table name')
    .option('-p, --partition <partition>', 'Partition key')
    .option('-b, --batch <size>', 'Number of logs to group in a batch for a single write (defaults to "1")')
    .action(async ({ account, key, table, partition, size }) => {
      try {
        const writeStream = await pinoAzureTable.createWriteStream({ account, key, table, partition, size })
        process.stdin.pipe(writeStream)
        console.info('logging')
      } catch (error) {
        console.log(error.message)
      }
    })

  program.parse(process.argv)
}

main()
