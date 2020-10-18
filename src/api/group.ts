import { E_ACCESS, E_INVALID_ACTION } from '../constants'
import { Group, Member, MemberRole } from '../entities'
import { BaseAPI } from './base'
import { APIContext, context, Controller, schema, Scope, type } from './decorators'

@Controller('group')
export class GroupAPI extends BaseAPI {
  @Scope('public')
  async find (name: string) {
    return this.manager.findOneOrFail(Group, { name })
  }

  @Scope('public')
  async get (id: string) {
    return this.manager.findOneOrFail(Group, id)
  }

  @Scope('public')
  async create (@context ctx: APIContext, id: string, name: string, disp: string, desc: string, email: string) {
    this.hub.user._isCurrentUserOrFail(ctx, id)
    return this.manager.transaction(async m => {
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
    })
  }

  @Scope('admin')
  @Scope('public')
  async listByUser (@context ctx: APIContext, userId: string) {
    this.hub.user._isCurrentUserOrFail(ctx, userId)
    const groups = await this.manager.find(Member, { where: { userId }, relations: ['group'] })
    return groups
  }

  @Scope('public')
  async listMembers (groupId: string) {
    return this.manager.find(Member, { where: { groupId }, relations: ['user'] })
  }

  @Scope('public')
  async addMember (@context ctx: APIContext, groupId: string, userId: string, @type('integer') @schema({ minimum: 1, maximum: 2 }) role: MemberRole) {
    await this.canManageOrFail(ctx, groupId)
    const member = new Member()
    member.userId = userId
    member.groupId = groupId
    member.role = role
    await this.manager.save(member)
    return member.id
  }

  @Scope('public')
  async updateMember (@context ctx: APIContext, id: string, @type('integer') @schema({ minimum: 1, maximum: 2 }) role: MemberRole) {
    const member = await this.manager.findOneOrFail(Member, id, { select: ['groupId'] })
    await this.canManageOrFail(ctx, member.groupId!)
    member.role = role
    await this.manager.save(member)
  }

  @Scope('public')
  async findMember (groupId: string, userId: string) {
    return this.manager.findOneOrFail(Member, { groupId, userId })
  }

  @Scope('public')
  async removeMember (@context ctx: APIContext, id: string) {
    const member = await this.manager.findOneOrFail(Member, id, { select: ['id', 'userId', 'groupId'] })
    await this.canManageOrFail(ctx, member.groupId!)
    if (member.userId === ctx.userId && member.role === MemberRole.owner) throw new Error(E_INVALID_ACTION)
    await this.manager.remove(member)
  }

  async canManageOrFail (ctx: APIContext, groupId: string) {
    if (ctx.scope === 'public') {
      const member = await this.manager.findOneOrFail(Member, { userId: ctx.userId, groupId })
      if (member.role === MemberRole.member) throw new Error(E_ACCESS)
    }
  }
}
