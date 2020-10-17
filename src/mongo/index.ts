import { MongoClient } from 'mongodb'
import { DI_MONGO_DB, STG_MONGO_CONN } from '../constants'
import { inject, stage } from '../manager'

stage(STG_MONGO_CONN).step(async () => {
  const client = new MongoClient('mongodb://localhost:27017/', { useUnifiedTopology: true })
  await client.connect()
  const db = client.db('perilla')
  inject<typeof db>(DI_MONGO_DB).provide(db)
})
