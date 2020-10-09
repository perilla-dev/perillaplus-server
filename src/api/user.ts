import { randomBytes } from 'crypto'
import { getManager } from 'typeorm'
import { E_ACCESS } from '../constants'
import { Group, Member, MemberRole, User, UserToken } from '../entities'
import { generateToken, pbkdf2Async } from '../misc'
import { BaseAPI } from './base'
import { context, Controller, APIContext, optional, Scope, NoAuth } from './decorators'

@Controller('user')
export class UserAPI extends BaseAPI {
  @Scope('public')
  @Scope('admin')
  async find (name: string) {
    const m = getManager()
    return m.findOneOrFail(User, { name })
  }

  @Scope('public')
  @Scope('admin')
  async get (id: string) {
    const m = getManager()
    return m.findOneOrFail(User, id)
  }

  @Scope('admin')
  async list () {
    const m = getManager()
    return m.find(User)
  }

  @Scope('admin')
  async create (name: string, disp: string, desc: string, email: string, passwd: string) {
    const m = getManager()
    const user = new User()
    user.name = name
    user.disp = disp
    user.desc = desc
    user.email = email
    user.salt = randomBytes(16).toString('hex')
    user.hash = await pbkdf2Async(passwd, user.salt, 1000, 64, 'sha512').then(b => b.toString('hex'))
    await m.save(user)
    return user.id
  }

  @Scope('admin')
  @Scope('public')
  async update (@context ctx: APIContext, id: string, @optional name?: string, @optional disp?: string, @optional desc?: string, @optional email?: string, @optional passwd?: string) {
    const m = getManager()
    this.currentId(ctx, id)
    const user = await m.findOneOrFail(User, id)
    user.name = name ?? user.name
    user.email = email ?? user.email
    user.disp = disp ?? user.disp
    user.desc = desc ?? user.desc
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

  @Scope('admin')
  @Scope('public')
  async listTokens (@context ctx: APIContext, userId: string) {
    const m = getManager()
    this.currentId(ctx, userId)
    const tokens = await m.find(UserToken, { userId })
    return tokens
  }

  @Scope('admin')
  @Scope('public')
  async removeToken (id: string) {
    const m = getManager()
    const token = await m.findOneOrFail(UserToken, id)
    await m.remove(token)
  }

  @Scope('admin')
  @Scope('public')
  async listGroups (@context ctx: APIContext, userId: string) {
    this.currentId(ctx, userId)
    const m = getManager()
    const groups = await m.find(Member, { where: { userId }, relations: ['group'] })
    return groups
  }

  @Scope('public') @NoAuth()
  async login (@context ctx: APIContext, name: string, pass: string, desc: string) {
    const m = getManager()
    const user = await m.findOneOrFail(User, { name }, { select: ['hash', 'salt', 'id'] })
    if (ctx.scope === 'public') {
      const hash = await pbkdf2Async(pass, user.salt, 1000, 64, 'sha512').then(b => b.toString('hex'))
      if (hash !== user.hash) throw new Error(E_ACCESS)
    }
    const token = new UserToken()
    token.token = await generateToken()
    token.userId = user.id
    token.desc = desc
    await m.save(token)
    return [user.id, token.id, token.token]
  }

  @Scope('public')
  async createGroup (@context ctx: APIContext, id: string, name: string, disp: string, desc: string, email: string) {
    this.currentId(ctx, id)
    const m = getManager()
    const group = new Group()
    group.name = name
    group.disp = disp
    group.desc = desc
    group.email = email
    await m.save(group)
    const member = new Member()
    member.groupId = group.id
    member.userId = id
    member.role = MemberRole.owner
    await m.save(member)
    return group.id
  }

  currentId (ctx: APIContext, id: string) {
    if (ctx.scope === 'public' && ctx.userId !== id) throw new Error(E_ACCESS)
  }
}
