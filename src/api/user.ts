import { randomBytes } from 'crypto'
import { getManager } from 'typeorm'
import { User, UserToken } from '../entities/user'
import { pbkdf2Async } from '../misc'
import { BaseAPI } from './base'
import { ControllerPath, Func, userid, optional, Admin } from './decorators'

@ControllerPath('user')
export class UserAPI extends BaseAPI {
  @Func
  async findOneOrFail (name: string) {
    const m = getManager()
    return m.findOneOrFail(User, { name })
  }

  @Func
  async getOneOrFail (id: string) {
    const m = getManager()
    return m.findOneOrFail(User, id)
  }

  @Func @Admin
  async list () {
    const m = getManager()
    return m.find(User)
  }

  @Func @Admin
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

  @Func
  async update (@userid id: string, @optional name?: string, @optional displayname?: string, @optional description?:string, @optional email?: string, @optional passwd?: string) {
    const m = getManager()
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

  @Func @Admin
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

  @Func
  async listTokens (@userid userId: string) {
    const m = getManager()
    const tokens = await m.find(UserToken, { userId })
    return tokens
  }

  @Func
  async removeToken (id: string) {
    const m = getManager()
    const token = await m.findOneOrFail(UserToken, id)
    await m.remove(token)
  }
}
