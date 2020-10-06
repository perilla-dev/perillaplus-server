import prompts from 'prompts'
import fetch from 'node-fetch'
import chalk from 'chalk'
import { DIM_CLIAPICALLERS, DI_ARGV, STG_CLI_MAIN } from '../constants'
import { inject, injectMutiple, stage } from '../manager'
import { inspect } from 'util'
import { addLineNumbers } from '../misc'

interface IParameter {
  name: string
  type: Function
}

const globalOptions = {
  base: '',
  token: '',
  lineNumbers: true
}

export class CLIAPICaller {
  private _path
  private _params
  constructor (path: string, params: IParameter[]) {
    this._path = path
    this._params = params
  }

  get category () {
    return this._path.split('/')[1]
  }

  get name () {
    return this._path.split('/')[2]
  }

  async invoke () {
    const body = await CLIAPICaller.askFor(this._params)
    if (!body) return
    const url = globalOptions.base + this._path
    console.log(chalk.blueBright(`[POST] ${url}`))
    const res = await fetch(url, {
      method: 'post',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': globalOptions.token
      }
    })
    const data = await res.json()
    console.log(chalk.blue('Response body:'))
    showData(data)
    return data
  }

  static askFor (params: IParameter[]): Promise<any> {
    return prompts(params.map(({ name, type }) => this.getQuestion(name, type)))
  }

  static getQuestion (name: string, type: Function) {
    return {
      name,
      message: this.generateMsg(name, type),
      ...(() => {
        switch (type) {
          case String: return { type: 'text' }
          case Number: return { type: 'number' }
          case Object: return { type: 'text', format: (v: string) => JSON.parse(v) }
          case Boolean: return { type: 'toggle' }
        }
        return { type: 'text', format: (v: string) => JSON.parse(v) }
      })()
    } as any
  }

  static generateMsg (name: string, type: Function) {
    let hint = 'unknown'
    switch (type) {
      case String: hint = 'string'; break
      case Number: hint = 'number'; break
      case Object: hint = 'object'; break
      case Boolean: hint = 'bool'; break
    }
    return `${name}(${hint})`
  }
}

stage(STG_CLI_MAIN).step(async () => {
  console.groupEnd()
  console.groupEnd()
  const argv = inject<any>(DI_ARGV).get()
  globalOptions.token = argv.token
  globalOptions.base = argv.base
  while (true) {
    const action: string = await prompts({
      type: 'select',
      name: 'value',
      message: 'Pick a action',
      choices: [
        { title: 'Call an API', value: 'invoke' },
        { title: 'CLI settings', value: 'settings' },
        { title: 'Exit CLI', value: 'exit' }
      ]
    }).then(r => r.value)
    switch (action) {
      case 'invoke':
        await invoke()
        break
      case 'exit':
        exit()
        break
      case 'settings':
        await settings()
        break
    }
  }
})

function exit () {
  process.exit(1)
}

async function invoke () {
  const callers = injectMutiple<CLIAPICaller>(DIM_CLIAPICALLERS).get()
  const categories = [...new Set(callers.map(c => c.category))]
  const category: string | undefined = await prompts({
    type: 'select',
    name: 'value',
    message: 'Pick a API category',
    choices: categories.map(c => ({ title: c, value: c }))
  }).then(r => r.value)
  if (!category) return
  const caller: CLIAPICaller | undefined = await prompts({
    type: 'select',
    name: 'value',
    message: 'Pick a API',
    choices: callers.filter(c => c.category === category).map(c => ({ title: c.name, value: c }))
  }).then(r => r.value)
  if (!caller) return
  await caller.invoke()
}

async function settings () {
  const options: any = globalOptions
  console.log(chalk.blue('Current settings:'))
  showData(options)
  const keys = Object.keys(options)
  const key: string = await prompts({
    type: 'select',
    name: 'value',
    message: 'Pick a item',
    choices: keys.map(c => ({ title: c, value: c }))
  }).then(r => r.value)
  if (!key) return
  const type = typeof options[key]
  await prompts(
    {
      message: `${key}(${type})`,
      name: 'value',
      initial: options[key],
      ...(() => {
        switch (type) {
          case 'number':
            return { type: 'number' }
          case 'string':
            return { type: 'text' }
          case 'boolean':
            return { type: 'toggle' }
        }
        return { type: 'text', format: (v: string) => JSON.parse(v) }
      })() as any
    },
    {
      onSubmit: (_, answer) => {
        options[key] = answer
      }
    }
  )
}

function showData (data: any) {
  let result = inspect(data, false, null, true)
  if (globalOptions.lineNumbers) result = addLineNumbers(result)
  console.log(result)
}
