import { getManager } from 'typeorm'
import { E_ACCESS, E_UNIMPL } from '../constants'
import { Member, Problem, Group, MemberRole, Contributor } from '../entities'
import { optionalSet } from '../misc'
import { BaseAPI } from './base'
import { APIContext, context, Controller, optional, Scope } from './decorators'

@Controller('problem')
export class ProblemAPI extends BaseAPI {
  @Scope('public')
  async get (@context ctx: APIContext, id: string) {
    const m = getManager()
    const problem = await m.findOneOrFail(Problem, id)
    await this.canReadOrFail(ctx, problem)
    return problem
  }

  @Scope('public')
  async listByGroup (@context ctx: APIContext, groupId: string) {
    const m = getManager()
    if (ctx.scope === 'public' && await this.hub.user.notInGroup(ctx.userId, groupId)) {
      return m.find(Problem, { groupId, pub: true })
    } else {
      return m.find(Problem, { groupId })
    }
  }

  @Scope('public')
  async createInGroup (@context ctx: APIContext, groupId: string, name: string, disp: string, desc: string, type: string, tags: string, pub: boolean) {
    const m = getManager()
    if (ctx.scope === 'public') {
      const member = await m.findOneOrFail(Member, { userId: ctx.userId, groupId })
      const group = await m.findOneOrFail(Group, groupId, { select: ['memberCreateProblem'] })
      if (!group.memberCreateProblem &&
        member.role === MemberRole.member) throw new Error(E_ACCESS)
    }
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
  }

  @Scope('public')
  async update (@context ctx:APIContext, id:string, @optional name?:string, @optional disp?:string, @optional desc?:string, @optional data?:string, @optional type?:string, @optional tags?:string, @optional pub?:boolean) {
    const m = getManager()
    const problem = await m.findOneOrFail(Problem, id)
    await this.canWriteOrFail(ctx, problem)
    optionalSet(problem, 'name', name)
    optionalSet(problem, 'disp', disp)
    optionalSet(problem, 'desc', desc)
    optionalSet(problem, 'data', data)
    optionalSet(problem, 'type', type)
    optionalSet(problem, 'tags', tags)
    optionalSet(problem, 'pub', pub)
    await m.save(problem)
  }

  @Scope('public')
  async addContributor (@context ctx: APIContext, problemId: string, userId: string) {
    const m = getManager()
    if (ctx.scope === 'public') {
      const problem = await m.findOneOrFail(Problem, problemId, { select: ['groupId'] })
      const member = await m.findOneOrFail(Member, { groupId: problem.groupId, userId: ctx.userId })
      if (member.role === MemberRole.member) throw new Error(E_ACCESS)
    }
    const contributor = new Contributor()
    contributor.problemId = problemId
    contributor.userId = userId
    await m.save(contributor)
    return contributor.id
  }

  async canReadOrFail (ctx: APIContext, problem: Problem) {
    if (ctx.scope === 'public') {
      if (problem.competitionId) {
        throw new Error(E_UNIMPL)
      } else {
        // Problem is public or user is in group is allowed
        if (!problem.pub && await this.hub.user.notInGroup(ctx.userId, problem.groupId)) throw new Error(E_ACCESS)
      }
    }
  }

  async canWriteOrFail (ctx: APIContext, problem: Problem) {
    if (ctx.scope === 'public') {
      const m = getManager()
      await m.findOneOrFail(Contributor, { problemId: problem.id, userId: ctx.userId })
    }
  }
}
