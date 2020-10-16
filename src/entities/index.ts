import { createConnection, getConnection, getManager } from 'typeorm'
import { inject, injectMutiple, stage } from '../manager'
import { ENV_SQLITE_DBPATH, STG_SRV_DB_CONN, DI_DBCONN, DIM_ENTITIES, STG_SRV_DB_INIT } from '../constants'
import { getAPIHub } from '../misc'
import { internalContext } from '../api'
import { isFirstRun } from '../misc/config'
export * from './competition'
export * from './file'
export * from './group'
export * from './problem'
export * from './submission'
export * from './user'

async function connectDB () {
  const conn = await createConnection({
    type: 'sqlite',
    database: ENV_SQLITE_DBPATH,
    entities: injectMutiple<any>(DIM_ENTITIES).get(),
    synchronize: isFirstRun()
  })
  inject<typeof conn>(DI_DBCONN).provide(conn)
}

stage(STG_SRV_DB_CONN)
  .step(connectDB, 'connect to database')

async function checkDBInfo () {
  const m = getManager()
  const entities = injectMutiple<any>(DIM_ENTITIES).get()
  const names = entities.map(x => x.name)
  const counts = await Promise.all(entities.map(x => m.count(x)))
  console.log('Database Info:')
  console.table([names, counts])
}

async function initDB () {
  if (isFirstRun()) {
    const api = getAPIHub()
    const userId = await api.user.create('admin', 'Administrator', 'system admin', 'i@zzs1.cn', '123456')
    console.log('Created user:\t', userId)
    const groupId = await api.group.create(internalContext(), userId, 'default', 'Default Group', 'default group', 'admin@zhangzisu.cn')
    console.log('Created group:\t', groupId)
  } else {
    const conn = getConnection()
    await conn.runMigrations()
  }
}

stage(STG_SRV_DB_INIT)
  .step(initDB)
  .step(checkDBInfo, 'check DB info')
