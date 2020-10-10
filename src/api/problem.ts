import { getManager } from 'typeorm'
import { E_ACCESS } from '../constants'
import { Member, Problem, Group, MemberRole, Contributor } from '../entities'
import { BaseAPI } from './base'
import { APIContext, context, Controller, Scope } from './decorators'

@Controller('problem')
export class ProblemAPI extends BaseAPI {
  @Scope('public')
  async listByGroup (@context ctx: APIContext, groupId: string) {
    const m = getManager()
    if (ctx.scope === 'public' && !m.count(Member, { userId: ctx.userId!, groupId })) {
      return m.find(Problem, { groupId, pub: true })
    } else {
      return m.find(Problem, { groupId })
    }
  }

  @Scope('public')
  async create (@context ctx: APIContext, groupId: string, name: string, disp: string, type: string, tags: string, pub: boolean) {
    const m = getManager()
    if (ctx.scope === 'public') {
      const member = await m.findOneOrFail(Member, { userId: ctx.userId, groupId: groupId })
      const group = await m.findOneOrFail(Group, groupId, { select: ['memberCreateProblem'] })
      if (!group.memberCreateProblem &&
        member.role === MemberRole.member) throw new Error(E_ACCESS)
    }
    const problem = new Problem()
    problem.name = name
    problem.disp = disp
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
