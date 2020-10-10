import { createConnection, getManager } from 'typeorm'
import { inject, injectMutiple, stage } from '../manager'
import { ENV_SQLITE_DBPATH, STG_SRV_DB, DI_DBCONN, DIM_ENTITIES } from '../constants'
import { getAPIHub } from '../misc'
import { internalContext } from '../api'
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

async function initDB () {
  const api = getAPIHub()
  const userId = await api.user.create('admin', 'Administrator', 'system admin', 'i@zzs1.cn', '123456')
  const groupId = await api.group.create(internalContext(), userId, 'default', 'Default Group', 'default group', 'admin@zhangzisu.cn')
  await api.notice.createInGroup(internalContext(), groupId, 'test', '测试', '内容')
  await api.problem.createInGroup(internalContext(), groupId, 'test', 'Test problem', '# content', 'simple-v1', '', true)
}

stage(STG_SRV_DB)
  .step(connectDB, 'connect to database')
  .step(checkDBInfo, 'check DB info')
  .step(initDB)
