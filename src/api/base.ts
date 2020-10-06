import { APIHub } from './hub'

export abstract class BaseAPI {
  hub: APIHub
  constructor (hub: APIHub) {
    this.hub = hub
  }
}
