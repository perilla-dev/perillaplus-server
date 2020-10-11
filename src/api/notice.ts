import { getManager, IsNull } from 'typeorm'
import { E_ACCESS } from '../constants'
import { Notice } from '../entities/notice'
import { optionalSet } from '../misc'
import { BaseAPI } from './base'
import { APIContext, context, Controller, optional, Scope } from './decorators'

@Controller('notice')
export class NoticeAPI extends BaseAPI {
  @Scope('public')
  async get (id: string) {
    const m = getManager()
    return m.findOneOrFail(Notice, id)
  }

  @Scope('public')
  async update (@context ctx: APIContext, id: string, @optional name?: string, @optional disp?: string, @optional desc?: string) {
    const m = getManager()
    const notice = await m.findOneOrFail(Notice, id)
    if (ctx.scope === 'public') {
      // No access to global notice in public scope
      if (!notice.groupId) throw new Error(E_ACCESS)
      await this.hub.group.canManageOrFail(ctx, notice.groupId)
    }
    optionalSet(notice, 'name', name)
    optionalSet(notice, 'disp', disp)
    optionalSet(notice, 'desc', desc)
    await m.save(notice)
  }

  @Scope('public')
  async listByGroup (groupId: string) {
    const m = getManager()
    return m.find(Notice, { groupId })
  }

  @Scope('public')
  async listGlobal () {
    const m = getManager()
    return m.find(Notice, { groupId: IsNull() })
  }

  @Scope('public')
  async createInGroup (@context ctx: APIContext, groupId: string, name: string, disp: string, desc: string) {
    const m = getManager()
    if (ctx.scope === 'public') {
      await this.hub.group.canManageOrFail(ctx, groupId)
    }
    const notice = new Notice()
    notice.name = name
    notice.disp = disp
    notice.desc = desc
    notice.groupId = groupId
    await m.save(notice)
    return notice.id
  }

  @Scope('admin')
  async createGlobal (name: string, disp: string, desc: string) {
    const m = getManager()
    const notice = new Notice()
    notice.name = name
    notice.disp = disp
    notice.desc = desc
    await m.save(notice)
    return notice.id
  }

  @Scope('public')
  async remove (@context ctx:APIContext, id: string) {
    const m = getManager()
    const notice = await m.findOneOrFail(Notice, id)
    if (ctx.scope === 'public') {
      if (!notice.groupId) throw new Error(E_ACCESS)
      await this.hub.group.canManageOrFail(ctx, notice.groupId)
    }
    await m.remove(notice)
  }
}
