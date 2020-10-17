import { IsNull } from 'typeorm'
import { E_ACCESS } from '../constants'
import { Notice } from '../entities/notice'
import { optionalSet } from '../misc'
import { BaseAPI } from './base'
import { APIContext, context, Controller, optional, Scope } from './decorators'

@Controller('notice')
export class NoticeAPI extends BaseAPI {
  @Scope('public')
  async get (id: string) {
    return this.manager.findOneOrFail(Notice, id)
  }

  @Scope('public')
  async update (@context ctx: APIContext, id: string, @optional name?: string, @optional disp?: string, @optional desc?: string, @optional tags?: string) {
    const notice = await this.manager.findOneOrFail(Notice, id)
    if (ctx.scope === 'public') {
      // No access to global notice in public scope
      if (!notice.groupId) throw new Error(E_ACCESS)
      await this.hub.group.canManageOrFail(ctx, notice.groupId)
    }
    optionalSet(notice, 'name', name)
    optionalSet(notice, 'disp', disp)
    optionalSet(notice, 'desc', desc)
    optionalSet(notice, 'tags', tags)
    await this.manager.save(notice)
  }

  @Scope('public')
  async listByGroup (groupId: string) {
    return this.manager.find(Notice, { groupId })
  }

  @Scope('public')
  async listGlobal () {
    return this.manager.find(Notice, { groupId: IsNull() })
  }

  @Scope('public')
  async createInGroup (@context ctx: APIContext, groupId: string, name: string, disp: string, desc: string, tags: string) {
    if (ctx.scope === 'public') {
      await this.hub.group.canManageOrFail(ctx, groupId)
    }
    const notice = new Notice()
    notice.name = name
    notice.disp = disp
    notice.desc = desc
    notice.tags = tags
    notice.groupId = groupId
    await this.manager.save(notice)
    return notice.id
  }

  @Scope('admin')
  async createGlobal (name: string, disp: string, desc: string, tags: string) {
    const notice = new Notice()
    notice.name = name
    notice.disp = disp
    notice.desc = desc
    notice.tags = tags
    await this.manager.save(notice)
    return notice.id
  }

  @Scope('public')
  async remove (@context ctx:APIContext, id: string) {
    const notice = await this.manager.findOneOrFail(Notice, id)
    if (ctx.scope === 'public') {
      if (!notice.groupId) throw new Error(E_ACCESS)
      await this.hub.group.canManageOrFail(ctx, notice.groupId)
    }
    await this.manager.remove(notice)
  }
}
