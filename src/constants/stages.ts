import { stage } from '../manager'

export const STG_SRV_MAIN = Symbol('server-main')
export const STG_SRV_ENTITY = Symbol('entity-init')
export const STG_SRV_APIHUB = Symbol('apihub')
export const STG_SRV_DB_CONN = Symbol('db-conn')
export const STG_SRV_DB_INIT = Symbol('db-conn')
export const STG_SRV_HTTPAPI = Symbol('api-init')
export const STG_SRV_HTTPSRV = Symbol('http-init')

export const STG_CLI_MAIN = Symbol('cli-main')
export const STG_CLI_API = Symbol('cli-api')

stage(STG_SRV_DB_CONN).dep(STG_SRV_ENTITY)
stage(STG_SRV_DB_INIT).dep(STG_SRV_DB_CONN).dep(STG_SRV_APIHUB)
stage(STG_SRV_APIHUB).dep(STG_SRV_DB_CONN)
stage(STG_SRV_HTTPAPI).dep(STG_SRV_APIHUB)
stage(STG_SRV_HTTPSRV).dep(STG_SRV_HTTPAPI).dep(STG_SRV_DB_INIT)
stage(STG_SRV_MAIN).dep(STG_SRV_HTTPSRV)

stage(STG_CLI_MAIN).dep(STG_CLI_API)
