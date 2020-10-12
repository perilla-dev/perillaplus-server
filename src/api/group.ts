import { getManager } from 'typeorm'
import { E_ACCESS, E_INVALID_ACTION } from '../constants'
import { Group, Member, MemberRole } from '../entities'
import { BaseAPI } from './base'
import { APIContext, context, Controller, schema, Scope, type } from './decorators'

@Controller('group')
export class GroupAPI extends BaseAPI {
  @Scope('public')
  async find (name: string) {
    const m = getManager()
    return m.findOneOrFail(Group, { name })
  }

  @Scope('public')
  async get (id: string) {
    const m = getManager()
    return m.findOneOrFail(Group, id)
  }

  @Scope('public')
  async create (@context ctx: APIContext, id: string, name: string, disp: string, desc: string, email: string) {
    this.hub.user.currentId(ctx, id)
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

  @Scope('admin')
  @Scope('public')
  async listByUser (@context ctx: APIContext, userId: string) {
    this.hub.user.currentId(ctx, userId)
    const m = getManager()
    const groups = await m.find(Member, { where: { userId }, relations: ['group'] })
    return groups
  }

  @Scope('public')
  async listMembers (groupId: string) {
    const m = getManager()
    return m.find(Member, { where: { groupId }, relations: ['user'] })
  }

  @Scope('public')
  async addMember (@context ctx: APIContext, groupId: string, userId: string, @type('integer') @schema({ minimum: 2, maximum: 3 }) role: MemberRole) {
    const m = getManager()
    if (ctx.scope === 'public') {
      const member = await m.findOneOrFail(Member, { userId: ctx.userId, groupId })
      if (member.role === MemberRole.member) throw new Error(E_ACCESS)
    }
    const member = new Member()
    member.userId = userId
    member.groupId = groupId
    member.role = role
    await m.save(member)
    return member.id
  }

  @Scope('public')
  async findMember (groupId: string, userId: string) {
    const m = getManager()
    return m.findOneOrFail(Member, { groupId, userId })
  }

  @Scope('public')
  async removeMember (@context ctx: APIContext, id: string) {
    const m = getManager()
    const member = await m.findOneOrFail(Member, id, { relations: ['userId', 'groupId'] })
    await this.canManageOrFail(ctx, member.groupId!)
    if (member.userId === ctx.userId && member.role === MemberRole.owner) throw new Error(E_INVALID_ACTION)
    await m.remove(member)
  }

  async canManageOrFail (ctx: APIContext, groupId: string) {
    if (ctx.scope === 'public') {
      const m = getManager()
      const member = await m.findOneOrFail(Member, { userId: ctx.userId, groupId })
      if (member.role === MemberRole.member) throw new Error(E_ACCESS)
    }
  }
}
