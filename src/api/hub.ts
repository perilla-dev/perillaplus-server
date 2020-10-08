import { GroupAPI } from './group'
import { UserAPI } from './user'

export class APIHub {
  user
  group

  constructor () {
    this.user = new UserAPI(this)
    this.group = new GroupAPI(this)
  }
}
