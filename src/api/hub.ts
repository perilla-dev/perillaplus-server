import { UserAPI } from './user'

export class APIHub {
  user
  constructor () {
    this.user = new UserAPI(this)
  }
}
