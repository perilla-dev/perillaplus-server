import { E_INVALID_ACTION } from '../constants'
import { Group, Member, MemberRole } from '../entities'
import { ensureAccess } from '../misc'
import { BaseAPI } from './base'
import { APIContext, context, Controller, schema, Scope, type } from './decorators'

@Controller('group')
export class GroupAPI extends BaseAPI {
  @Scope('public')
  @Scope('admin')
  async find (@context ctx: APIContext, name: string) {
    return this.manager.findOneOrFail(Group, { name })
  }

  @Scope('public')
  @Scope('admin')
  async get (@context ctx: APIContext, groupId: string) {
    return this.manager.findOneOrFail(Group, groupId)
  }

  @Scope('public')
  @Scope('admin')
  async create (@context ctx: APIContext, userId: string, name: string, email: string) {
    await ensureAccess(this.hub.user._canManage(ctx, userId))

    return this.manager.transaction(async m => {
      const group = new Group()
      group.name = name
      group.disp = name
      group.desc = ''
      group.email = email
      await m.save(group)
      const member = new Member()
      member.groupId = group.id
      member.userId = userId
      member.role = MemberRole.owner
      await m.save(member)
      return group.id
    })
  }

  @Scope('admin')
  @Scope('public')
  async listByUser (@context ctx: APIContext, userId: string) {
    const groups = await this.manager.find(Member, { where: { userId }, relations: ['group'] })
    return groups
  }

  @Scope('admin')
  @Scope('public')
  async listMembers (@context ctx: APIContext, groupId: string) {
    return this.manager.find(Member, { where: { groupId }, relations: ['user'] })
  }

  @Scope('admin')
  @Scope('public')
  async addMember (@context ctx: APIContext, groupId: string, userId: string, @type('integer') @schema({ minimum: 1, maximum: 2 }) role: MemberRole) {
    await ensureAccess(this._canManage(ctx, groupId))

    const member = new Member()
    member.userId = userId
    member.groupId = groupId
    member.role = role
    await this.manager.save(member)
    return member.id
  }

  @Scope('admin')
  @Scope('public')
  async updateMember (@context ctx: APIContext, memberId: string, @type('integer') @schema({ minimum: 1, maximum: 2 }) role: MemberRole) {
    const member = await this.manager.findOneOrFail(Member, memberId, { select: ['groupId'] })
    await ensureAccess(this._canManage(ctx, member.groupId!))

    member.role = role
    await this.manager.save(member)
  }

  @Scope('admin')
  @Scope('public')
  async findMember (@context ctx: APIContext, groupId: string, userId: string) {
    return this.manager.findOneOrFail(Member, { groupId, userId })
  }

  @Scope('admin')
  @Scope('public')
  async removeMember (@context ctx: APIContext, memberId: string) {
    const member = await this.manager.findOneOrFail(Member, memberId, { select: ['id', 'userId', 'groupId'] })
    await ensureAccess(this._canManage(ctx, member.groupId!))

    if (member.userId === ctx.userId && member.role === MemberRole.owner) throw new Error(E_INVALID_ACTION)
    await this.manager.remove(member)
  }

  async _canManage (ctx: APIContext, groupId: string) {
    if (ctx.scope === 'public') {
      const member = await this.manager.findOneOrFail(Member, { userId: ctx.userId, groupId })
      return member.role !== MemberRole.member
    }
    return true
  }
}
