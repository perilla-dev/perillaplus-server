import { randomBytes } from 'crypto'
import { E_ACCESS, E_INVALID_TOKEN } from '../constants'
import { Member, User, UserRole, UserToken } from '../entities'
import { ensureAccess, generateToken, optionalSet, pbkdf2Async } from '../misc'
import { BaseAPI } from './base'
import { context, Controller, APIContext, optional, Scope, NoAuth } from './decorators'

@Controller('user')
export class UserAPI extends BaseAPI {
  @Scope('public')
  @Scope('admin')
  async find (@context ctx: APIContext, name: string) {
    return this.manager.findOneOrFail(User, { name })
  }

  @Scope('public')
  @Scope('admin')
  async get (@context ctx: APIContext, userId: string) {
    return this.manager.findOneOrFail(User, userId)
  }

  @Scope('admin')
  @Scope('public')
  async update (@context ctx: APIContext, userId: string, @optional name?: string, @optional disp?: string, @optional desc?: string, @optional email?: string, @optional passwd?: string) {
    await ensureAccess(this._canManage(ctx, userId))

    const user = await this.manager.findOneOrFail(User, userId)
    optionalSet(user, 'name', name)
    optionalSet(user, 'email', email)
    optionalSet(user, 'disp', disp)
    optionalSet(user, 'desc', desc)
    if (passwd) {
      user.salt = randomBytes(16).toString('hex')
      user.hash = await pbkdf2Async(passwd, user.salt, 1000, 64, 'sha512').then(b => b.toString('hex'))
    }
    await this.manager.save(user)
  }

  @Scope('admin')
  async remove (@context ctx: APIContext, userId: string) {
    const user = await this.manager.findOneOrFail(User, userId)
    await this.manager.remove(user)
  }

  @Scope('admin')
  @Scope('public')
  async listTokens (@context ctx: APIContext, userId: string) {
    await ensureAccess(this._canManage(ctx, userId))

    const tokens = await this.manager.find(UserToken, { userId })
    return tokens
  }

  @Scope('admin')
  @Scope('public')
  async removeToken (@context ctx: APIContext, tokenId: string) {
    const token = await this.manager.findOneOrFail(UserToken, tokenId)
    await this.manager.remove(token)
  }

  @Scope('public') @NoAuth()
  async login (@context ctx: APIContext, name: string, pass: string, desc: string) {
    const user = await this.manager.findOneOrFail(User, { name }, { select: ['hash', 'salt', 'id'] })
    if (ctx.scope === 'public') {
      const hash = await pbkdf2Async(pass, user.salt, 1000, 64, 'sha512').then(b => b.toString('hex'))
      if (hash !== user.hash) throw new Error(E_ACCESS)
    }
    const token = new UserToken()
    token.token = await generateToken()
    token.userId = user.id
    token.desc = desc
    await this.manager.save(token)
    return [user.id, token.id, token.token]
  }

  async _canManage (ctx: APIContext, userId: string) {
    return ctx.scope !== 'public' || ctx.userId === userId
  }

  async _validateTokenOrFail (ctx: APIContext, val: string) {
    const token = await this.manager.findOne(UserToken, { token: val })
    if (!token) throw new Error(E_INVALID_TOKEN)
    return token.userId
  }

  async _notInGroup (ctx: APIContext, userId: string | undefined, groupId: string) {
    if (!userId) return false
    return !await this.manager.count(Member, { userId, groupId })
  }

  async _isAdmin (ctx: APIContext, userId: string) {
    return !!await this.manager.count(User, { id: userId, role: UserRole.admin })
  }
}
