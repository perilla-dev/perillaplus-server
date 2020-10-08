require('reflect-metadata')
require('dotenv').config()

const yargs = require('yargs')

const mod = require('./build/src')

// eslint-disable-next-line no-unused-expressions
yargs
  .command(
    'server',
    'server',
    yargs => yargs.option('port', { type: 'number', demandOption: true, default: 3000 }),
    argv => mod.server(argv)
  )
  .command(
    'cli',
    'cli',
    yargs => yargs
      .option('token', { type: 'string', demandOption: true })
      .option('base', { type: 'string', demandOption: true, default: 'http://127.0.0.1:3000/api' }),
    argv => mod.cli(argv)
  )
  .help()
  .argv
