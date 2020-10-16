import { E_ACCESS, E_UNIMPL } from '../constants'
import { Member, Problem, Group, MemberRole, Contributor } from '../entities'
import { optionalSet } from '../misc'
import { BaseAPI } from './base'
import { APIContext, context, Controller, optional, Scope } from './decorators'

@Controller('problem')
export class ProblemAPI extends BaseAPI {
  @Scope('public')
  async get (@context ctx: APIContext, id: string) {
    const problem = await this.manager.findOneOrFail(Problem, id, { relations: ['contributors', 'contributors.user', 'files'] })
    await this.canViewOrFail(ctx, problem)
    return problem
  }

  @Scope('public')
  async listByGroup (@context ctx: APIContext, groupId: string) {
    if (ctx.scope === 'public' && await this.hub.user.notInGroup(ctx.userId, groupId)) {
      return this.manager.find(Problem, { groupId, pub: true })
    } else {
      return this.manager.find(Problem, { groupId })
    }
  }

  @Scope('public')
  async createInGroup (@context ctx: APIContext, groupId: string, name: string, disp: string, desc: string, type: string, tags: string, pub: boolean) {
    if (ctx.scope === 'public') {
      const member = await this.manager.findOneOrFail(Member, { userId: ctx.userId, groupId })
      const group = await this.manager.findOneOrFail(Group, groupId, { select: ['memberCreateProblem'] })
      if (!group.memberCreateProblem &&
        member.role === MemberRole.member) throw new Error(E_ACCESS)
    }
    return this.manager.transaction(async m => {
      const problem = new Problem()
      problem.groupId = groupId
      problem.name = name
      problem.disp = disp
      problem.desc = desc
      problem.type = type
      problem.tags = tags
      problem.pub = pub
      await m.save(problem)
      if (ctx.scope === 'public') {
        const contributor = new Contributor()
        contributor.userId = ctx.userId!
        contributor.problemId = problem.id
        await m.save(contributor)
      }
      return problem.id
    })
  }

  @Scope('public')
  async update (@context ctx: APIContext, id: string, @optional name?: string, @optional disp?: string, @optional desc?: string, @optional data?: string, @optional type?: string, @optional tags?: string, @optional pub?: boolean) {
    const problem = await this.manager.findOneOrFail(Problem, id)
    await this.canManageOrFail(ctx, id)
    optionalSet(problem, 'name', name)
    optionalSet(problem, 'disp', disp)
    optionalSet(problem, 'desc', desc)
    optionalSet(problem, 'data', data)
    optionalSet(problem, 'type', type)
    optionalSet(problem, 'tags', tags)
    optionalSet(problem, 'pub', pub)
    await this.manager.save(problem)
  }

  @Scope('public')
  async addContributor (@context ctx: APIContext, problemId: string, userId: string) {
    if (ctx.scope === 'public') {
      const problem = await this.manager.findOneOrFail(Problem, problemId, { select: ['groupId'] })
      await this.hub.group.canManageOrFail(ctx, problem.groupId)
    }
    const contributor = new Contributor()
    contributor.problemId = problemId
    contributor.userId = userId
    await this.manager.save(contributor)
    return contributor.id
  }

  @Scope('public')
  async removeContributor (@context ctx: APIContext, id: string) {
    const contributor = await this.manager.findOneOrFail(Contributor, id, { select: ['id', 'problemId'] })
    if (ctx.scope === 'public') {
      const problem = await this.manager.findOneOrFail(Problem, contributor.problemId, { select: ['groupId'] })
      await this.hub.group.canManageOrFail(ctx, problem.groupId)
    }
    await this.manager.remove(contributor)
  }

  @Scope('public')
  async listContributors (@context ctx: APIContext, problemId: string) {
    const problem = await this.manager.findOneOrFail(Problem, problemId)
    await this.canViewOrFail(ctx, problem)
    return this.manager.find(Contributor, { where: { problemId }, relations: ['user'] })
  }

  async canViewOrFail (ctx: APIContext, problem: Problem) {
    if (ctx.scope === 'public') {
      if (problem.competitionId) {
        throw new Error(E_UNIMPL)
      } else {
        // Problem is public or user is in group is allowed
        if (!problem.pub && await this.hub.user.notInGroup(ctx.userId, problem.groupId)) throw new Error(E_ACCESS)
      }
    }
  }

  async canManage (ctx: APIContext, problemId: string) {
    if (ctx.scope === 'public') {
      return !!await this.manager.count(Contributor, { problemId, userId: ctx.userId })
    }
    return true
  }

  async canManageOrFail (ctx: APIContext, problemId: string) {
    if (!this.canManage(ctx, problemId)) throw new Error(E_ACCESS)
  }
}
