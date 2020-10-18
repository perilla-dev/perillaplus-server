import { stage } from '../manager'

export const STG_SRV_MAIN = Symbol('Server Main')
export const STG_SRV_ENTITY = Symbol('Initialize entities')
export const STG_SRV_APIHUB = Symbol('Initialize APIHub')
export const STG_SRV_DB_CONN = Symbol('Connect to database')
export const STG_SRV_DB_INIT = Symbol('Initialize database')
export const STG_MONGO_CONN = Symbol('Connect to mongo')
export const STG_SRV_HTTPAPI = Symbol('Initialize HTTP API')
export const STG_SRV_HTTPSRV = Symbol('Initialize server')

export const STG_CLI_MAIN = Symbol('CLI Main')
export const STG_CLI_API = Symbol('Initialize CLI API Invoker')

stage(STG_SRV_DB_CONN).dep(STG_SRV_ENTITY)
stage(STG_SRV_DB_INIT).dep(STG_SRV_DB_CONN).dep(STG_SRV_APIHUB).dep(STG_MONGO_CONN)
stage(STG_SRV_APIHUB).dep(STG_SRV_DB_CONN).dep(STG_MONGO_CONN)
stage(STG_SRV_HTTPAPI).dep(STG_SRV_APIHUB)
stage(STG_SRV_HTTPSRV).dep(STG_SRV_HTTPAPI).dep(STG_SRV_DB_INIT)
stage(STG_SRV_MAIN).dep(STG_SRV_HTTPSRV)

stage(STG_CLI_MAIN).dep(STG_CLI_API)
