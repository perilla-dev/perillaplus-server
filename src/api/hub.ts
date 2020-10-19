import { Connection } from 'typeorm'
import { DI_DBCONN } from '../constants'
import { inject } from '../manager'
import { API } from './decorators'
import { FileAPI } from './file'
import { GroupAPI } from './group'
import { JudgerAPI } from './judger'
import { NoticeAPI } from './notice'
import { ProblemAPI } from './problem'
import { SolutionAPI } from './solution'
import { UserAPI } from './user'

export class APIHub {
  @API(UserAPI) user
  @API(FileAPI) file
  @API(GroupAPI) group
  @API(JudgerAPI) judger
  @API(NoticeAPI) notice
  @API(ProblemAPI) problem
  @API(SolutionAPI) solution

  conn
  manager

  constructor () {
    this.conn = inject<Connection>(DI_DBCONN).get()
    this.manager = this.conn.manager

    this.user = new UserAPI(this)
    this.file = new FileAPI(this)
    this.group = new GroupAPI(this)
    this.judger = new JudgerAPI(this)
    this.notice = new NoticeAPI(this)
    this.problem = new ProblemAPI(this)
    this.solution = new SolutionAPI(this)
  }
}
