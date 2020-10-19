import { IsNull } from 'typeorm'
import { E_ACCESS } from '../constants'
import { Notice } from '../entities/notice'
import { ensureAccess, optionalSet } from '../misc'
import { BaseAPI } from './base'
import { APIContext, context, Controller, optional, Scope } from './decorators'

@Controller('notice')
export class NoticeAPI extends BaseAPI {
  @Scope('public')
  @Scope('admin')
  async get (@context ctx: APIContext, noticeId: string) {
    return this.manager.findOneOrFail(Notice, noticeId)
  }

  @Scope('public')
  @Scope('admin')
  async update (@context ctx: APIContext, noticeId: string, @optional name?: string, @optional disp?: string, @optional desc?: string, @optional tags?: string) {
    const notice = await this.manager.findOneOrFail(Notice, noticeId)
    if (ctx.scope === 'public') {
      // No access to global notice in public scope
      if (!notice.groupId) throw new Error(E_ACCESS)
      await ensureAccess(this.hub.group._canManage(ctx, notice.groupId))
    }

    optionalSet(notice, 'name', name)
    optionalSet(notice, 'disp', disp)
    optionalSet(notice, 'desc', desc)
    optionalSet(notice, 'tags', tags)
    await this.manager.save(notice)
  }

  @Scope('public')
  @Scope('admin')
  async listByGroup (@context ctx: APIContext, groupId: string) {
    return this.manager.find(Notice, { groupId })
  }

  @Scope('public')
  @Scope('admin')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async listGlobal (@context ctx: APIContext) {
    return this.manager.find(Notice, { groupId: IsNull() })
  }

  @Scope('public')
  @Scope('admin')
  async createInGroup (@context ctx: APIContext, groupId: string, name: string, disp: string, desc: string, tags: string) {
    await ensureAccess(this.hub.group._canManage(ctx, groupId))

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
  async createGlobal (@context ctx: APIContext, name: string, disp: string, desc: string, tags: string) {
    const notice = new Notice()
    notice.name = name
    notice.disp = disp
    notice.desc = desc
    notice.tags = tags
    await this.manager.save(notice)
    return notice.id
  }

  @Scope('public')
  @Scope('admin')
  async remove (@context ctx:APIContext, noticeId: string) {
    const notice = await this.manager.findOneOrFail(Notice, noticeId)
    if (ctx.scope === 'public') {
      if (!notice.groupId) throw new Error(E_ACCESS)
      await ensureAccess(this.hub.group._canManage(ctx, notice.groupId))
    }

    await this.manager.remove(notice)
  }
}
