import { getManager } from 'typeorm'
import { E_ACCESS, E_UNIMPL } from '../constants'
import { Member, Problem, Group, MemberRole, Contributor } from '../entities'
import { BaseAPI } from './base'
import { APIContext, context, Controller, Scope } from './decorators'

@Controller('problem')
export class ProblemAPI extends BaseAPI {
  @Scope('public')
  async get (@context ctx: APIContext, id: string) {
    const m = getManager()
    const problem = await m.findOneOrFail(Problem, id)
    if (ctx.scope === 'public') {
      if (problem.competitionId) {
        throw new Error(E_UNIMPL)
      } else {
        // Problem is public or user is in group is allowed
        if (!problem.pub && await this.hub.user.notInGroup(ctx.userId, problem.groupId)) throw new Error(E_ACCESS)
      }
    }
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
  async createInGroup (@context ctx: APIContext, groupId: string, name: string, disp: string, desc:string, type: string, tags: string, pub: boolean) {
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
}
