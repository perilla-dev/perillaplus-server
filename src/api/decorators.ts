import { FastifyPluginAsync, FastifyRequest } from 'fastify'
import { DI_API_FASTIFY_PLUGIN, E_ACCESS, STG_SRV_API } from '../constants'
import { inject, stage } from '../manager'
import { getParamnames, getAPIHub } from '../misc'

type TypeName = 'undefined' | 'object' | 'boolean' | 'number' | 'string'
type IAPIScopeName = 'public' | 'admin' | 'judger' | 'internal'

export class APIContext {
  userId?: string
  scope

  constructor (scope: IAPIScopeName) {
    this.scope = scope
  }
}

export function internalContext () {
  return new APIContext('internal')
}

interface IFastifyRequestWithContext extends FastifyRequest {
  ctx: APIContext
}

class APIFuncParamMeta extends Map<string, any> {
  type
  name
  constructor (type: Function, name: string) {
    super()
    this.type = type
    this.name = name
  }

  get typeName (): TypeName {
    switch (this.type) {
      case String: return 'string'
      case Number: return 'number'
      case Object: return 'object'
      case Boolean: return 'boolean'
    }
    return 'undefined'
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
}

class APIFuncMeta extends Map<string, any> {
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
    this.func = <Function>target[propertyKey].bind(target)
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
        result.properties[param.name] = { type: param.typeName }
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
    const func = this.func
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

class APIControllerMeta extends Map<string, any> {
  static kMeta = Symbol('api-controller-meta')
  static get (constructor: Function) {
    let meta: APIControllerMeta = Reflect.getMetadata(this.kMeta, constructor)
    if (!meta) {
      Reflect.defineMetadata(this.kMeta, meta = new APIControllerMeta(), constructor)
    }
    return meta
  }
}

class APIScope {
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
    const parseToken = async (req: IFastifyRequestWithContext) => {
      const at = req.headers['x-access-token']
      if (!at || typeof at !== 'string') { throw new Error(E_ACCESS) }
      req.ctx.userId = await api.user.validateToken(at)
    }
    return async server => {
      server.decorateRequest('ctx', '')
      for (const func of this.funcs) {
        const bodyschema = func.generateBodySchema()
        const endpoint = func.generateURL()
        const handler = func.generateHandler()
        const options = { schema: { body: bodyschema }, preHandler: [contextInit] }
        if (func.auth) options.preHandler.push(parseToken)
        server.post(endpoint, options as any, handler)
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

// #region Method decorators
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
// #endregion

stage(STG_SRV_API).step(() => {
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

// stage(STG_CLI_API).step(() => {
//   const callers = injectMutiple<CLIAPICaller>(DIM_CLIAPICALLERS)
//   for (const { target, propertyKey } of APIFuncMeta.all) {
//     const meta = APIFuncMeta.get(target, propertyKey)
//     callers.provide(new CLIAPICaller(meta.generateURL(), meta.params))
//   }
// }, 'generate api list for cli')
