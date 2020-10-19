import { File, Problem, Solution, SolutionState } from '../entities'
import { ensureAccess, optionalSet } from '../misc'
import { BaseAPI } from './base'
import { APIContext, context, Controller, optional, schema, Scope, type } from './decorators'

interface ISolutionFileDTO {
  rawId: string
  path: string
  pub: boolean
}

const SolutionFilesSchema = {
  items: {
    properties: {
      rawId: {
        type: 'string'
      },
      path: {
        type: 'string'
      },
      pub: {
        type: 'boolean'
      }
    },
    required: [
      'rawId',
      'path',
      'pub'
    ],
    additionalItems: false
  }
}

@Controller('solution')
export class SolutionAPI extends BaseAPI {
  @Scope('public')
  @Scope('admin')
  @Scope('judger')
  async get (@context ctx: APIContext, solutionId: string) {
    const solution = await this.manager.findOneOrFail(Solution, solutionId, { relations: ['user', 'files'] })
    await ensureAccess(this._canView(ctx, solution))

    return solution
  }

  @Scope('public')
  @Scope('admin')
  async listByProblem (@context ctx: APIContext, problemId: string) {
    const problem = await this.manager.findOneOrFail(Problem, problemId)
    await ensureAccess(this.hub.problem._canView(ctx, problem))

    if (ctx.scope === 'public' && !await this.hub.problem._canManage(ctx, problem.id)) {
      return this.manager.find(
        Solution,
        {
          where: [
            { problemId, pub: true },
            { problemId, userId: ctx.userId! }
          ],
          relations: ['user']
        }
      )
    } else {
      return this.manager.find(Solution, { where: { problemId }, relations: ['user'] })
    }
  }

  @Scope('public')
  @Scope('admin')
  async createInProblem (@context ctx: APIContext, problemId: string, data: string, pub: boolean, @type('array') @schema(SolutionFilesSchema) files: ISolutionFileDTO[]) {
    const problem = await this.manager.findOneOrFail(Problem, problemId)
    await ensureAccess(this.hub.problem._canView(ctx, problem))

    return this.manager.transaction(async m => {
      const solution = new Solution()
      solution.state = SolutionState.Pending
      solution.data = data
      solution.pub = pub
      solution.type = problem.type
      solution.problemId = problemId
      solution.userId = ctx.userId!
      await m.save(solution)
      for (const f of files) {
        const file = new File()
        file.path = f.path
        file.pub = f.pub
        file.rawId = f.rawId
        file.solutionId = solution.id
        await m.save(file)
      }
      return solution.id
    })
  }

  @Scope('public')
  @Scope('admin')
  async updateVis (@context ctx: APIContext, solutionId: string, pub: boolean) {
    const solution = await this.manager.findOneOrFail(Solution, solutionId)
    await ensureAccess(this._canManage(ctx, solution))

    solution.pub = pub
    await this.manager.save(solution)
  }

  @Scope('admin')
  @Scope('judger')
  async update (@context ctx: APIContext, solutionId: string, @optional state?: SolutionState, @optional status?: string, @optional details?: string) {
    const solution = await this.manager.findOneOrFail(Solution, solutionId)
    optionalSet(solution, 'state', state)
    optionalSet(solution, 'status', status)
    optionalSet(solution, 'details', details)
  }

  async _canView (ctx: APIContext, solution: Solution) {
    if (ctx.scope === 'public' && !(solution.pub || solution.userId === ctx.userId)) {
      return this.hub.problem._canManage(ctx, solution.problemId)
    }
    return true
  }

  async _canManage (ctx: APIContext, solution: Solution) {
    if (ctx.scope === 'public') {
      if (ctx.userId !== solution.userId) return false
    }
    return true
  }
}
