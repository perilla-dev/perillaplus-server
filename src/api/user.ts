import { randomBytes } from 'crypto'
import { Collection } from 'mongodb'
import { E_ACCESS, E_INVALID_TOKEN } from '../constants'
import { Member, User, UserToken } from '../entities'
import { generateToken, optionalSet, pbkdf2Async } from '../misc'
import { BaseAPI } from './base'
import { context, Controller, APIContext, optional, Scope, NoAuth } from './decorators'
import { APIHub } from './hub'

interface IUserMeta {
  admin?: boolean
}

@Controller('user')
export class UserAPI extends BaseAPI {
  col: Collection<IUserMeta>

  constructor (hub: APIHub) {
    super(hub)
    this.col = this.hub.mongo.collection('user')
  }

  @Scope('public')
  @Scope('admin')
  async find (name: string) {
    return this.manager.findOneOrFail(User, { name })
  }

  @Scope('public')
  @Scope('admin')
  async get (id: string) {
    return this.manager.findOneOrFail(User, id)
  }

  @Scope('admin')
  async list () {
    return this.manager.find(User)
  }

  @Scope('admin')
  async create (name: string, disp: string, desc: string, email: string, passwd: string) {
    const user = new User()
    user.name = name
    user.disp = disp
    user.desc = desc
    user.email = email
    user.salt = randomBytes(16).toString('hex')
    user.hash = await pbkdf2Async(passwd, user.salt, 1000, 64, 'sha512').then(b => b.toString('hex'))
    await this.manager.save(user)
    return user.id
  }

  @Scope('admin')
  @Scope('public')
  async update (@context ctx: APIContext, id: string, @optional name?: string, @optional disp?: string, @optional desc?: string, @optional email?: string, @optional passwd?: string) {
    this._isCurrentUserOrFail(ctx, id)
    const user = await this.manager.findOneOrFail(User, id)
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
  async remove (id: string) {
    const user = await this.manager.findOneOrFail(User, id)
    await this.manager.remove(user)
  }

  @Scope('admin')
  @Scope('public')
  async listTokens (@context ctx: APIContext, userId: string) {
    this._isCurrentUserOrFail(ctx, userId)
    const tokens = await this.manager.find(UserToken, { userId })
    return tokens
  }

  @Scope('admin')
  @Scope('public')
  async removeToken (id: string) {
    const token = await this.manager.findOneOrFail(UserToken, id)
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

  @Scope('admin')
  async setMeta (id: string, meta: any) {
    await this.col.updateOne({ _id: id }, { $set: meta }, { upsert: true })
  }

  @Scope('admin')
  async getMeta (id: string) {
    return this.col.findOne({ _id: id })
  }

  _isCurrentUserOrFail (ctx: APIContext, id: string) {
    if (ctx.scope === 'public' && ctx.userId !== id) throw new Error(E_ACCESS)
  }

  async _validateTokenOrFail (val: string) {
    const token = await this.manager.findOne(UserToken, { token: val })
    if (!token) throw new Error(E_INVALID_TOKEN)
    return token.userId
  }

  async _notInGroup (userId: string | undefined, groupId: string) {
    if (!userId) return false
    return !await this.manager.count(Member, { userId, groupId })
  }

  async _isAdminOrFail (id: string) {
    const meta = await this.getMeta(id)
    if (!meta || !meta.admin) throw new Error(E_ACCESS)
  }
}
