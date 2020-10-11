import { getManager } from 'typeorm'
import { APIHub } from './hub'

export abstract class BaseAPI {
  hub

  constructor (hub: APIHub) {
    this.hub = hub
  }

  get manager () {
    return getManager()
  }
}
