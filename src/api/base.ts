import { getManager } from 'typeorm'
import { APIHub } from './hub'

export abstract class BaseAPI {
  hub
  m

  constructor (hub: APIHub) {
    this.hub = hub
    this.m = getManager()
  }
}
