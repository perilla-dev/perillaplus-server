import { Db } from 'mongodb'
import { APIHub } from '../api'
import { DI_APIHUB, DI_MONGO_DB } from '../constants'
import { inject } from '../manager'

export function getAPIHub () {
  return inject<APIHub>(DI_APIHUB).get()
}

export function getMongoDb () {
  return inject<Db>(DI_MONGO_DB).get()
}
