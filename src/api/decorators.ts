import { FastifyPluginAsync, FastifyRequest, RouteHandler, RouteShorthandOptions } from 'fastify'
import { E_ACCESS, STG_CLI_API, STG_SRV_API, DI_HTTP_APPAPI, DI_HTTP_PUBAPI, DIM_CLIAPICALLERS } from '../constants'
import { getAPI, getParamnames } from '../misc'
import { inject, injectMutiple, stage } from '../manager'
import { CLIAPICaller } from '../cli'

// #region Type definations
type TypeName = 'undefined' | 'object' | 'boolean' | 'number' | 'string'

interface IAPIFuncData {
  target: any
  propertyKey: string
}

interface IEndpointRegistration {
  endpoint: string
  options: RouteShorthandOptions,
  handler: RouteHandler
}

interface IEndpointDescription {
  endpoint: string
  auth: boolean
  admin: boolean
}
// #endregion

const APIFunctions = new Set<IAPIFuncData>()

class APIFuncParam<K = string, V = any> extends Map<K, V> {
  type
  name
  constructor (type: Function, name: string) {
    super()
    this.type = type
    this.name = name
  }

  typeName (): TypeName {
    switch (this.type) {
      case String: return 'string'
      case Number: return 'number'
      case Object: return 'object'
      case Boolean: return 'boolean'
    }
    return 'undefined'
  }
}

class APIFunc<K = string, V = any> extends Map<K, V> {
  controller
  params: APIFuncParam[]
  name: string
  func: Function

  constructor (target: any, propertyKey: string | symbol) {
    super()
    const paramtypes: Function[] = Reflect.getMetadata('design:paramtypes', target, propertyKey)
    const paramnames = getParamnames(target[propertyKey])
    this.controller = APIController.get(target.constructor)
    this.name = target[propertyKey].name
    this.func = <Function>target[propertyKey].bind(target)
    this.params = [...Array(paramtypes.length)].map((_, i) => new APIFuncParam(paramtypes[i], paramnames[i]))
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
      result.properties[param.name] = { type: param.typeName() }
      if (!param.get('optional')) {
        result.required.push(param.name)
      }
    }
    return result
  }

  generateHandler () {
    // eslint-disable-next-line no-new-func
    const parser = new Function('o', `return [${this.params.map(x => `o.${x.name}`).join(',')}]`)
    const func = this.func
    return (req: FastifyRequest) =>
      Promise.resolve(func(...parser(req.body)))
        .then(result => ({ ok: 1, result }))
        .catch(e => ({ ok: 0, result: e.name }))
  }

  static kMeta = Symbol('api-func-meta')

  static get (target: Object, propertyKey: string | symbol) {
    let meta: APIFunc = Reflect.getMetadata(this.kMeta, target, propertyKey)
    if (!meta) {
      Reflect.defineMetadata(this.kMeta, meta = new APIFunc(target, propertyKey), target, propertyKey)
    }
    return meta
  }
}

class APIController<K = string, V = any> extends Map<K, V> {
  static kMeta = Symbol('api-controller-meta')
  static get (constructor: Function) {
    let meta: APIController = Reflect.getMetadata(this.kMeta, constructor)
    if (!meta) {
      Reflect.defineMetadata(this.kMeta, meta = new APIController(), constructor)
    }
    return meta
  }
}

// #region Class decorators
export function ControllerPath (path: string) {
  return function (constructor: Function) {
    const meta = APIController.get(constructor)
    meta.set('path', path)
  }
}
// #endregion

// #region Method decorators
export function Func (target: Object, propertyKey: string) {
  APIFunctions.add({ target, propertyKey })
}

export function Name (name: string) {
  return function (target: Object, propertyKey: string) {
    const meta = APIFunc.get(target, propertyKey)
    meta.name = name
  }
}

export function Admin (target: Object, propertyKey: string) {
  const meta = APIFunc.get(target, propertyKey)
  meta.set('auth', true)
  meta.set('admin', true)
}
// #endregion

// #region Parameter decorators
export function optional (target: Object, key: string | symbol, i: number) {
  const meta = APIFunc.get(target, key)
  meta.params[i].set('optional', true)
}

export function userid (target: Object, key: string | symbol, i: number) {
  const meta = APIFunc.get(target, key)
  meta.set('auth', true)
  meta.params[i].set('uid', true)
}
// #endregion

function createGuards () {
  const api = getAPI()
  return {
    // Guards
    authGuard: async (req: any) => {
      const at = req.headers['x-access-token']
      if (!at || typeof at !== 'string') { throw new Error(E_ACCESS) }
      req.userId = await api.user.validateToken(at)
    },
    adminGuard: async (req: any) => api.misc.isAdmin(req.userId),
    appInstanceGuard: async (req: any) => {
      const token = req.headers['x-app-token']
      if (!token || typeof token !== 'string') { throw new Error(E_ACCESS) }
      const instance = await api.app.validateToken(token)
      req.appId = instance.appId
      req.instanceId = instance.id
    },
    // Guard Factories
    userIdGuardFactory: (key: string) => async (req: any) => {
      if (!await api.misc.isAdmin(req.userId) && req.userId !== req.body[key]) throw new Error(E_ACCESS)
    }
  }
}

stage(STG_SRV_API).step(() => {
  const { authGuard, adminGuard, userIdGuardFactory, appInstanceGuard } = createGuards()

  const publicEndpoints: IEndpointRegistration[] = []
  const publicEndpointDesc: IEndpointDescription[] = []
  const appEndpoints: IEndpointRegistration[] = []
  for (const { target, propertyKey } of APIFunctions) {
    const meta = APIFunc.get(target, propertyKey)
    const bodyschema = meta.generateBodySchema()
    const endpoint = meta.generateURL()
    const handler = meta.generateHandler()

    const publicOptions = { schema: { body: bodyschema }, preHandler: <any[]>[] }
    if (meta.get('auth')) publicOptions.preHandler.push(authGuard)
    if (meta.get('admin')) publicOptions.preHandler.push(adminGuard)
    meta.params
      .filter(p => p.get('uid'))
      .forEach(p => publicOptions.preHandler.push(userIdGuardFactory(p.name)))
    publicEndpoints.push({ endpoint, options: publicOptions, handler })
    publicEndpointDesc.push({ auth: meta.get('auth'), admin: meta.get('admin'), endpoint })

    const appOptions = { schema: { body: bodyschema }, preHandler: <any[]>[] }
    appEndpoints.push({ endpoint, options: appOptions, handler })
  }
  console.log('Public Endpoints:')
  console.table(publicEndpointDesc)
  inject<FastifyPluginAsync>(DI_HTTP_PUBAPI).provide(async server => {
    server.decorateRequest('userId', '')
    for (const { endpoint, options, handler } of publicEndpoints) {
      server.post(endpoint, options, handler)
    }
  })
  inject<FastifyPluginAsync>(DI_HTTP_APPAPI).provide(async server => {
    server.decorateRequest('appId', '')
    server.decorateRequest('instanceId', '')
    server.addHook('preHandler', appInstanceGuard)
    for (const { endpoint, options, handler } of appEndpoints) {
      server.post(endpoint, options, handler)
    }
  })
}, 'generate fastify plugins')

stage(STG_CLI_API).step(() => {
  const callers = injectMutiple<CLIAPICaller>(DIM_CLIAPICALLERS)
  for (const { target, propertyKey } of APIFunctions) {
    const meta = APIFunc.get(target, propertyKey)
    callers.provide(new CLIAPICaller(meta.generateURL(), meta.params))
  }
}, 'generate api list for cli')
