import { FastifyPluginAsync, FastifyRequest } from 'fastify'
import { CLIAPICaller } from '../cli'
import { DIM_CLIAPICALLERS, DI_API_FASTIFY_PLUGIN, E_ACCESS, STG_CLI_API, STG_SRV_HTTPAPI } from '../constants'
import { inject, injectMutiple, stage } from '../manager'
import { getParamnames, getAPIHub, JSONSchemaTypeName, JSONSchemaType } from '../misc'

type IAPIScopeName = 'public' | 'admin' | 'judger' | 'internal'

export class APIContext {
  userId?: string
  scope

  constructor (scope: IAPIScopeName) {
    this.scope = scope
  }
}

const apiNames = new WeakMap<Object, string>()

export function internalContext () {
  return new APIContext('internal')
}

interface IFastifyRequestWithContext extends FastifyRequest {
  ctx: APIContext
}

export class APIFuncParamMeta extends Map<string, any> {
  type
  name

  constructor (type: Function, name: string) {
    super()
    this.type = JSONSchemaTypeName(type)
    this.name = name
  }

  get context () {
    return this.has('context')
  }

  get inject () {
    return this.context
  }

  get optional () {
    return this.has('optional')
  }

  get code () {
    if (this.context) {
      return 'req.ctx'
    } else {
      return `req.body.${this.name}`
    }
  }

  generateSchema () {
    let schema: any = {
      type: this.type
    }
    if (this.has('schema')) {
      schema = {
        ...schema,
        ...this.get('schema')
      }
    }
    return schema
  }
}

export class APIFuncMeta extends Map<string, any> {
  controller
  params: APIFuncParamMeta[]
  name: string
  func: Function

  constructor (target: any, propertyKey: string | symbol) {
    super()
    const paramtypes: Function[] = Reflect.getMetadata('design:paramtypes', target, propertyKey)
    const paramnames = getParamnames(target[propertyKey])
    this.controller = APIControllerMeta.get(target.constructor)
    this.name = target[propertyKey].name
    this.func = <Function>target[propertyKey]
    this.params = [...Array(paramtypes.length)].map((_, i) => new APIFuncParamMeta(paramtypes[i], paramnames[i]))
  }

  get auth () {
    return !this.has('noauth')
  }

  generateURL () {
    if (this.controller.has('path')) {
      return `/${this.controller.get('path')}/${this.name.toLowerCase()}`
    }
    return `/${this.name}`
  }

  generateBodySchema () {
    const result = {
      $schema: 'http://json-schema.org/draft-07/schema',
      type: 'object',
      properties: {} as any,
      required: [] as string[],
      additionalItems: false
    }
    for (const param of this.params) {
      if (!param.inject) {
        result.properties[param.name] = param.generateSchema()
        if (!param.optional) {
          result.required.push(param.name)
        }
      }
    }
    return result
  }

  generateHandler () {
    // eslint-disable-next-line no-new-func
    const parser = new Function('req', `return [${this.params.map(x => x.code).join(',')}]`)
    const api = getAPIHub() as any
    const func = this.func.bind(api[apiNames.get(this.controller.raw)!])
    return (req: FastifyRequest) =>
      Promise.resolve(func(...parser(req)))
        .then(result => ({ ok: 1, result }))
        .catch(e => ({ ok: 0, result: e.name }))
  }

  static kMeta = Symbol('api-func-meta')

  static get (target: Object, propertyKey: string | symbol) {
    let meta: APIFuncMeta = Reflect.getMetadata(this.kMeta, target, propertyKey)
    if (!meta) {
      Reflect.defineMetadata(this.kMeta, meta = new APIFuncMeta(target, propertyKey), target, propertyKey)
    }
    return meta
  }
}

export class APIControllerMeta extends Map<string, any> {
  raw

  constructor (raw: Object) {
    super()
    this.raw = raw
  }

  static kMeta = Symbol('api-controller-meta')
  static get (constructor: Object) {
    let meta: APIControllerMeta = Reflect.getMetadata(this.kMeta, constructor)
    if (!meta) {
      Reflect.defineMetadata(this.kMeta, meta = new APIControllerMeta(constructor), constructor)
    }
    return meta
  }
}

export class APIScope {
  name
  funcs

  constructor (name: IAPIScopeName) {
    this.name = name
    this.funcs = <APIFuncMeta[]>[]
  }

  generateFastifyPlugin (): FastifyPluginAsync {
    const api = getAPIHub()
    const contextInit = async (req: IFastifyRequestWithContext) => {
      req.ctx = new APIContext(this.name)
    }
    const parseUserToken = async (req: IFastifyRequestWithContext) => {
      const at = req.headers['x-access-token']
      if (!at || typeof at !== 'string') { throw new Error(E_ACCESS) }
      req.ctx.userId = await api.user.validateTokenOrFail(at)
    }
    const parseAdminToken = async (req: IFastifyRequestWithContext) => {
      const at = req.headers['x-access-token']
      if (!at || typeof at !== 'string') { throw new Error(E_ACCESS) }
      req.ctx.userId = await api.user.validateTokenOrFail(at)
      await api.user.isAdminOrFail(req.ctx.userId)
    }
    const parseJudgerToken = async (req: IFastifyRequestWithContext) => {
      const at = req.headers['x-access-token']
      if (!at || typeof at !== 'string') { throw new Error(E_ACCESS) }
      await api.judger.validateTokenOrFail(at)
    }

    return async server => {
      server.decorateRequest('ctx', '')
      // @ts-expect-error
      server.addHook('preHandler', contextInit)

      if (this.name === 'admin') {
        // @ts-expect-error
        server.addHook('preHandler', parseAdminToken)
      }

      if (this.name === 'judger') {
        // @ts-expect-error
        server.addHook('preHandler', parseJudgerToken)
      }

      for (const func of this.funcs) {
        const bodyschema = func.generateBodySchema()
        const endpoint = func.generateURL()
        const handler = func.generateHandler()
        const options = { schema: { body: bodyschema }, preHandler: [] as any[] }
        if (this.name === 'public' && func.auth) {
          options.preHandler.push(parseUserToken)
        }
        server.post(endpoint, options, handler)
      }
    }
  }

  static all = new Map<IAPIScopeName, APIScope>()
  static get (name: IAPIScopeName) {
    let ret = this.all.get(name)
    if (ret) return ret
    this.all.set(name, ret = new APIScope(name))
    return ret
  }
}
// #region Class decorators
export function Controller (path: string) {
  return function (constructor: Function) {
    const meta = APIControllerMeta.get(constructor)
    meta.set('path', path)
  }
}
// #endregion

// #region Method & Property decorators
export function Scope (name: IAPIScopeName) {
  return function (target: Object, propertyKey: string) {
    APIScope.get(name).funcs.push(APIFuncMeta.get(target, propertyKey))
  }
}

export function NoAuth () {
  return function (target: Object, propertyKey: string) {
    APIFuncMeta.get(target, propertyKey).set('noauth', true)
  }
}

export function API (api: Object) {
  return function (target: Object, propertyKey: string) {
    apiNames.set(api, propertyKey)
  }
}
// #endregion

// #region Parameter decorators
export function optional (target: Object, key: string | symbol, i: number) {
  const meta = APIFuncMeta.get(target, key)
  meta.params[i].set('optional', true)
}

export function context (target: Object, key: string | symbol, i: number) {
  const meta = APIFuncMeta.get(target, key)
  meta.params[i].set('context', true)
}

export function type (t: JSONSchemaType) {
  return function (target: Object, key: string | symbol, i: number) {
    const meta = APIFuncMeta.get(target, key)
    meta.params[i].type = t
  }
}

export function schema (s: any) {
  return function (target: Object, key: string | symbol, i: number) {
    const meta = APIFuncMeta.get(target, key)
    meta.params[i].set('schema', s)
  }
}
// #endregion

stage(STG_SRV_HTTPAPI).step(() => {
  inject<FastifyPluginAsync>(DI_API_FASTIFY_PLUGIN).provide(async server => {
    server.setErrorHandler((error, request, reply) => {
      reply.code(200)
      reply.send({ ok: 0, result: error.message })
    })
    for (const [, scope] of APIScope.all) {
      server.register(scope.generateFastifyPlugin(), { prefix: `/${scope.name}` })
    }
  })
})

stage(STG_CLI_API).step(() => {
  const callers = injectMutiple<CLIAPICaller>(DIM_CLIAPICALLERS)
  for (const [, scope] of APIScope.all) {
    for (const func of scope.funcs) {
      const caller = new CLIAPICaller(scope.name, func.generateURL(), func.params)
      callers.provide(caller)
    }
  }
}, 'generate api list for cli')
