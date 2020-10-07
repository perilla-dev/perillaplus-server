import { randomBytes } from 'crypto'
import { getManager } from 'typeorm'
import { E_ACCESS } from '../constants'
import { User, UserToken } from '../entities/user'
import { pbkdf2Async } from '../misc'
import { BaseAPI } from './base'
import { Auth, context, Controller, APIContext, optional, Scope } from './decorators'

@Controller('user')
export class UserAPI extends BaseAPI {
  @Scope('public')
  @Scope('admin')
  async findOneOrFail (name: string) {
    const m = getManager()
    return m.findOneOrFail(User, { name })
  }

  @Scope('public')
  @Scope('admin')
  async getOneOrFail (id: string) {
    const m = getManager()
    return m.findOneOrFail(User, id)
  }

  @Scope('admin')
  async list () {
    const m = getManager()
    return m.find(User)
  }

  @Scope('admin')
  async create (name: string, displayname: string, description: string, email: string, passwd: string) {
    const m = getManager()
    const user = new User()
    user.name = name
    user.displayname = displayname
    user.description = description
    user.email = email
    user.salt = randomBytes(16).toString('hex')
    user.hash = await pbkdf2Async(passwd, user.salt, 1000, 64, 'sha512').then(b => b.toString('hex'))
    await m.save(user)
    return user.id
  }

  @Scope('admin')
  @Scope('public') @Auth()
  async update (@context ctx: APIContext, id: string, @optional name?: string, @optional displayname?: string, @optional description?: string, @optional email?: string, @optional passwd?: string) {
    const m = getManager()
    this.currentId(ctx, id)
    const user = await m.findOneOrFail(User, id)
    user.name = name ?? user.name
    user.email = email ?? user.email
    user.displayname = displayname ?? user.displayname
    user.description = description ?? user.description
    if (passwd) {
      user.salt = randomBytes(16).toString('hex')
      user.hash = await pbkdf2Async(passwd, user.salt, 1000, 64, 'sha512').then(b => b.toString('hex'))
    }
    await m.save(user)
  }

  @Scope('admin')
  async remove (id: string) {
    const m = getManager()
    const user = await m.findOneOrFail(User, id)
    await m.remove(user)
  }

  async validateToken (val: string) {
    const m = getManager()
    const token = await m.findOneOrFail(UserToken, { token: val })
    return token.userId
  }

  @Scope('public')
  @Scope('admin')
  async listTokens (@context ctx: APIContext, userId: string) {
    const m = getManager()
    this.currentId(ctx, userId)
    const tokens = await m.find(UserToken, { userId })
    return tokens
  }

  @Scope('public')
  @Scope('admin')
  async removeToken (id: string) {
    const m = getManager()
    const token = await m.findOneOrFail(UserToken, id)
    await m.remove(token)
  }

  currentId (ctx: APIContext, id: string) {
    if (ctx.scope === 'public' && ctx.userId !== id) throw new Error(E_ACCESS)
  }
}
