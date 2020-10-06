import { stage } from '../manager'

export const STG_SRV_MAIN = Symbol('server-main')
export const STG_SRV_ENTITY = Symbol('entity-init')
export const STG_SRV_DB = Symbol('db-init')
export const STG_SRV_API = Symbol('api-init')
export const STG_SRV_HTTP = Symbol('http-init')

export const STG_CLI_MAIN = Symbol('cli-main')
export const STG_CLI_API = Symbol('cli-api')

stage(STG_SRV_MAIN).dep(STG_SRV_HTTP)
stage(STG_SRV_HTTP).dep(STG_SRV_API).dep(STG_SRV_DB)
stage(STG_SRV_DB).dep(STG_SRV_ENTITY)

stage(STG_CLI_MAIN).dep(STG_CLI_API)
