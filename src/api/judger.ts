import { getManager } from 'typeorm'
import { E_INVALID_ACTION, E_INVALID_TOKEN, STG_SRV_HTTPSRV } from '../constants'
import { Judger, Problem, ProblemType, Solution, SolutionState } from '../entities'
import { stage } from '../manager'
import { optionalSet } from '../misc'
import { BaseAPI } from './base'
import { APIContext, context, Controller, optional, Scope } from './decorators'

class SolutionQueue {
  queue: string[] = []

  push (id: string) {
    this.queue.push(id)
  }

  pop () {
    return this.queue.shift()
  }

  empty () {
    return !this.queue.length
  }
}

const queues = new Map<string, SolutionQueue>()

export function getQueue (type: string) {
  let queue = queues.get(type)
  if (!queue) queues.set(type, queue = new SolutionQueue())
  return queue
}

@Controller('judger')
export class JudgerAPI extends BaseAPI {
  @Scope('judger')
  async whoami (@context ctx: APIContext) {
    const judger = await this.manager.findOneOrFail(Judger, ctx.judgerId!)
    return judger
  }

  @Scope('judger')
  async popSolution (@context ctx: APIContext, typeId: string) {
    const queue = getQueue(typeId)
    if (queue.empty()) return null
    return queue.pop()
  }

  @Scope('judger')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async listProblemTypes (@context ctx: APIContext) {
    return this.manager.find(ProblemType)
  }

  @Scope('judger')
  async getProblem (@context ctx: APIContext, problemId: string) {
    return this.manager.findOneOrFail(Problem, problemId, { select: ['id', 'data', 'type', 'updated'], relations: ['files', 'files.raw'] })
  }

  @Scope('judger')
  async getSolution (@context ctx: APIContext, solutionId: string) {
    return this.manager.findOneOrFail(Solution, solutionId, { select: ['id', 'data', 'type', 'problemId'], relations: ['files', 'files.raw'] })
  }

  @Scope('judger')
  async updateSolution (@context ctx: APIContext, solutionId: string, @optional state?: SolutionState, @optional status?: string, @optional details?: string) {
    const solution = await this.manager.findOneOrFail(Solution, solutionId)
    // Ensure every solution is judged by exactly one judger
    if (solution.judgerId) {
      if (solution.judgerId !== ctx.judgerId) throw new Error(E_INVALID_ACTION)
    } else {
      solution.judgerId = ctx.judgerId!
    }
    optionalSet(solution, 'state', state)
    optionalSet(solution, 'status', status)
    optionalSet(solution, 'details', details)
    await this.manager.save(solution)
  }

  @Scope('public')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async list (@context ctx: APIContext) {
    return this.manager.find(Judger)
  }

  async _validateTokenOrFail (ctx: APIContext, token: string) {
    const judger = await this.manager.findOne(Judger, { token }, { select: ['id'] })
    if (!judger) throw new Error(E_INVALID_TOKEN)
    return judger.id
  }
}

stage(STG_SRV_HTTPSRV).step(async function queuePendingSolutions () {
  const m = getManager()
  const solutions = await m.find(Solution, { state: SolutionState.Queued })
  console.log(`Pushing ${solutions.length} solutions into queue`)
  for (const solution of solutions) {
    getQueue(solution.typeId).push(solution.id)
  }
})
