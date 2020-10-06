require('reflect-metadata')
require('dotenv').config()

const yargs = require('yargs')
const fs = require('fs')
const path = require('path')

/**
 * @param {string} dir
 */
function loadAll (dir) {
  const content = fs.readdirSync(dir)
  for (const item of content) {
    const next = path.join(dir, item)
    const stat = fs.statSync(next)
    if (stat.isFile() && path.extname(item) === '.js') {
      require(next)
    }
    if (stat.isDirectory()) {
      loadAll(next)
    }
  }
}

loadAll(path.resolve('./build/src'))

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
