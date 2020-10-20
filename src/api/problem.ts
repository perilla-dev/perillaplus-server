import { E_UNIMPL } from '../constants'
import { Problem, Group, Contributor, Solution } from '../entities'
import { ensureAccess, optionalSet } from '../misc'
import { BaseAPI } from './base'
import { APIContext, context, Controller, optional, Scope } from './decorators'

@Controller('problem')
export class ProblemAPI extends BaseAPI {
  @Scope('public')
  @Scope('admin')
  async get (@context ctx: APIContext, problemId: string) {
    const problem = await this.manager.findOneOrFail(Problem, problemId, { relations: ['contributors', 'contributors.user', 'files'] })
    await ensureAccess(this._canView(ctx, problem))

    return problem
  }

  @Scope('public')
  @Scope('admin')
  async listByGroup (@context ctx: APIContext, groupId: string) {
    if (ctx.scope === 'public' && await this.hub.user._notInGroup(ctx, ctx.userId, groupId)) {
      return this.manager.find(Problem, { groupId, pub: true })
    } else {
      return this.manager.find(Problem, { groupId })
    }
  }

  @Scope('public')
  @Scope('admin')
  async createInGroup (@context ctx: APIContext, userId: string, groupId: string, typeId: string, name: string, disp: string, desc: string, tags: string, pub: boolean) {
    await ensureAccess(
      this.hub.user._canManage(ctx, userId),
      this._canCreate(ctx, groupId)
    )

    return this.manager.transaction(async m => {
      const problem = new Problem()
      problem.groupId = groupId
      problem.typeId = typeId
      problem.name = name
      problem.disp = disp
      problem.desc = desc
      problem.tags = tags
      problem.pub = pub
      await m.save(problem)
      const contributor = new Contributor()
      contributor.userId = userId
      contributor.problemId = problem.id
      await m.save(contributor)
      return problem.id
    })
  }

  @Scope('public')
  @Scope('admin')
  async update (@context ctx: APIContext, problemId: string, @optional name?: string, @optional disp?: string, @optional desc?: string, @optional tags?:string, @optional data?: string, @optional pub?: boolean) {
    const problem = await this.manager.findOneOrFail(Problem, problemId)
    await ensureAccess(this._canManage(ctx, problemId))

    optionalSet(problem, 'name', name)
    optionalSet(problem, 'disp', disp)
    optionalSet(problem, 'desc', desc)
    optionalSet(problem, 'tags', tags)
    optionalSet(problem, 'data', data)
    optionalSet(problem, 'pub', pub)
    await this.manager.save(problem)
  }

  @Scope('public')
  @Scope('admin')
  async updateType (@context ctx:APIContext, problemId: string, typeId: string) {
    const problem = await this.manager.findOneOrFail(Problem, problemId)
    await ensureAccess(this._canManage(ctx, problemId))
    if (typeId === problem.typeId) return
    return this.manager.transaction(async m => {
      problem.typeId = typeId
      await m.save(problem)
      await m.delete(Solution, { problemId })
    })
  }

  @Scope('public')
  @Scope('admin')
  async addContributor (@context ctx: APIContext, problemId: string, userId: string) {
    const problem = await this.manager.findOneOrFail(Problem, problemId, { select: ['groupId'] })
    await ensureAccess(this.hub.group._canManage(ctx, problem.groupId))

    const contributor = new Contributor()
    contributor.problemId = problemId
    contributor.userId = userId
    await this.manager.save(contributor)
    return contributor.id
  }

  @Scope('public')
  @Scope('admin')
  async removeContributor (@context ctx: APIContext, contributorId: string) {
    const contributor = await this.manager.findOneOrFail(Contributor, contributorId, { select: ['id', 'problemId'] })
    if (ctx.scope === 'public') {
      const problem = await this.manager.findOneOrFail(Problem, contributor.problemId, { select: ['groupId'] })
      await ensureAccess(this.hub.group._canManage(ctx, problem.groupId))
    }

    await this.manager.remove(contributor)
  }

  @Scope('public')
  @Scope('admin')
  async listContributors (@context ctx: APIContext, problemId: string) {
    const problem = await this.manager.findOneOrFail(Problem, problemId)
    await ensureAccess(this._canView(ctx, problem))

    return this.manager.find(Contributor, { where: { problemId }, relations: ['user'] })
  }

  async _canView (ctx: APIContext, problem: Problem) {
    if (ctx.scope === 'public') {
      if (problem.competitionId) {
        throw new Error(E_UNIMPL)
      } else {
        // Problem is public or user is in group is allowed
        if (!problem.pub && await this.hub.user._notInGroup(ctx, ctx.userId, problem.groupId)) return false
      }
    }
    return true
  }

  async _canCreate (ctx: APIContext, groupId: string) {
    if (ctx.scope === 'public') {
      const group = await this.manager.findOneOrFail(Group, groupId, { select: ['memberCreateProblem'] })
      return group.memberCreateProblem || await this.hub.group._canManage(ctx, groupId)
    }
    return true
  }

  async _canManage (ctx: APIContext, problemId: string) {
    if (ctx.scope === 'public') {
      return !!await this.manager.count(Contributor, { problemId, userId: ctx.userId })
    }
    return true
  }
}
