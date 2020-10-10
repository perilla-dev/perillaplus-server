import { API } from './decorators'
import { GroupAPI } from './group'
import { NoticeAPI } from './notice'
import { ProblemAPI } from './problem'
import { UserAPI } from './user'

export class APIHub {
  @API(UserAPI) user
  @API(GroupAPI) group
  @API(NoticeAPI) notice
  @API(ProblemAPI) problem

  constructor () {
    this.user = new UserAPI(this)
    this.group = new GroupAPI(this)
    this.notice = new NoticeAPI(this)
    this.problem = new ProblemAPI(this)
  }
}
