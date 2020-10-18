import prompts from 'prompts'
import fetch from 'node-fetch'
import chalk from 'chalk'
import { DIM_CLIAPICALLERS, DI_ARGV, STG_CLI_MAIN } from '../constants'
import { inject, injectMutiple, stage } from '../manager'
import { inspect } from 'util'
import { addLineNumbers } from '../misc'
import { APIFuncParamMeta } from '../api/decorators'

const globalOptions = {
  base: '',
  token: '',
  lineNumbers: true
}

export class CLIAPICaller {
  private _scope
  private _path
  private _params
  constructor (scope: string, path: string, params: APIFuncParamMeta[]) {
    this._scope = scope
    this._path = path
    this._params = params
  }

  get scope () {
    return this._scope
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
    const url = globalOptions.base + `/${this.scope}` + this._path
    console.log(chalk.blueBright(`[POST] ${url}`))
    const res = await fetch(url, {
      method: 'post',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        ...(globalOptions.token ? { 'x-access-token': globalOptions.token } : {})
      }
    })
    const data = await res.json()
    console.log(chalk.blue('Response body:'))
    showData(data)
    return data
  }

  static askFor (params: APIFuncParamMeta[]): Promise<any> {
    return prompts(params.filter(x => !x.inject).map(({ name, type }) => this.getQuestion(name, type)))
  }

  static getQuestion (name: string, type: string) {
    return {
      name,
      message: `${name}(${type})`,
      ...(() => {
        switch (type) {
          case 'string': return { type: 'text' }
          case 'number': return { type: 'number' }
          case 'object': return { type: 'text', format: (v: string) => JSON.parse(v) }
          case 'boolean': return { type: 'toggle' }
        }
        return { type: 'text', format: (v: string) => JSON.parse(v) }
      })()
    } as any
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
  process.exit(0)
}

async function invoke () {
  let callers = injectMutiple<CLIAPICaller>(DIM_CLIAPICALLERS).get()
  const scopes = [...new Set(callers.map(c => c.scope))]
  const scope: string | undefined = await prompts({
    type: 'select',
    name: 'value',
    message: 'Pick a API scope',
    choices: scopes.map(c => ({ title: c, value: c }))
  }).then(r => r.value)
  if (!scope) return
  callers = callers.filter(x => x.scope === scope)

  const categories = [...new Set(callers.map(c => c.category))]
  const category: string | undefined = await prompts({
    type: 'select',
    name: 'value',
    message: 'Pick a API category',
    choices: categories.map(c => ({ title: c, value: c }))
  }).then(r => r.value)
  if (!category) return
  callers = callers.filter(x => x.category === category)

  const caller: CLIAPICaller | undefined = await prompts({
    type: 'select',
    name: 'value',
    message: 'Pick a API',
    choices: callers.map(c => ({ title: c.name, value: c }))
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
