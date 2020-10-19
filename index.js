require('reflect-metadata')
require('dotenv').config()

const path = require('path')
const yargs = require('yargs')

const mod = require('./build/src')

const dataDir = path.resolve(__dirname, 'data')

// eslint-disable-next-line no-unused-expressions
yargs
  .command(
    'server',
    'server',
    yargs => yargs
      .option('port', { type: 'number', demandOption: true, default: 3000 })
      .option('dataDir', { type: 'string', demandCommand: true, default: dataDir })
    ,
    argv => mod.server(argv)
  )
  .command(
    'cli',
    'cli',
    yargs => yargs
      .option('token', { type: 'string', default: '' })
      .option('base', { type: 'string', demandOption: true, default: 'http://127.0.0.1:3000/api' })
      .option('dataDir', { type: 'string', demandCommand: true, default: dataDir })
    ,
    argv => mod.cli(argv)
  )
  .help()
  .argv
