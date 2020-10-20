import { randomBytes } from 'crypto'
import { APIContext } from '.'
import { Notice, ProblemType, User, UserRole } from '../entities'
import { pbkdf2Async } from '../misc'
import { BaseAPI } from './base'
import { Scope, context, schema, type } from './decorators'

export class AdminAPI extends BaseAPI {
  @Scope('admin')
  async createGlobalNotice (@context ctx: APIContext, name: string, disp: string, desc: string, tags: string) {
    const notice = new Notice()
    notice.name = name
    notice.disp = disp
    notice.desc = desc
    notice.tags = tags
    await this.manager.save(notice)
    return notice.id
  }

  @Scope('admin')
  async addProblemType (@context ctx: APIContext, name: string, desc: string) {
    const type = new ProblemType()
    type.name = name
    type.desc = desc
    await this.manager.save(type)
    return type.id
  }

  @Scope('admin')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async listUser (@context ctx: APIContext) {
    return this.manager.find(User)
  }

  @Scope('admin')
  async createUser (@context ctx: APIContext, name: string, disp: string, desc: string, email: string, @type('integer') @schema({ minimum: 0, maximum: 255 }) role: UserRole, passwd: string) {
    const user = new User()
    user.name = name
    user.disp = disp
    user.desc = desc
    user.email = email
    user.role = role
    user.salt = randomBytes(16).toString('hex')
    user.hash = await pbkdf2Async(passwd, user.salt, 1000, 64, 'sha512').then(b => b.toString('hex'))
    await this.manager.save(user)
    return user.id
  }

  @Scope('admin')
  async updateUserPriv (@context ctx: APIContext, userId: string, @type('integer') @schema({ minimum: 0, maximum: 255 }) role: UserRole) {
    const user = await this.manager.findOneOrFail(User, userId)
    user.role = role
    await this.manager.save(user)
  }
}
