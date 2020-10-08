import { createConnection, getManager } from 'typeorm'
import { inject, injectMutiple, stage } from '../manager'
import { ENV_SQLITE_DBPATH, STG_SRV_DB, DI_DBCONN, DIM_ENTITIES } from '../constants'
export * from './competition'
export * from './contributor'
export * from './file'
export * from './group'
export * from './member'
export * from './participatant'
export * from './problem'
export * from './submission'
export * from './user'

async function connectDB () {
  const conn = await createConnection({
    type: 'sqlite',
    database: ENV_SQLITE_DBPATH,
    entities: injectMutiple<any>(DIM_ENTITIES).get(),
    synchronize: true
  })
  inject<typeof conn>(DI_DBCONN).provide(conn)
}

async function checkDBInfo () {
  const m = getManager()
  const entities = injectMutiple<any>(DIM_ENTITIES).get()
  const names = entities.map(x => x.name)
  const counts = await Promise.all(entities.map(x => m.count(x)))
  console.log('Database Info:')
  console.table([names, counts])
}

stage(STG_SRV_DB)
  .step(connectDB, 'connect to database')
  .step(checkDBInfo, 'check DB info')
