import { APIHub } from './hub'

export abstract class BaseAPI {
  hub
  conn
  manager

  constructor (hub: APIHub) {
    this.hub = hub
    this.conn = hub.conn
    this.manager = hub.manager
  }
}
