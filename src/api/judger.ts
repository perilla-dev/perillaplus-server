import { E_ACCESS } from '../constants'
import { Judger, Problem, Solution, SolutionState } from '../entities'
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
  async popSolution (ctx: APIContext, typeId: string) {
    const queue = getQueue(typeId)
    if (queue.empty()) return null
    return queue.pop()
  }

  @Scope('admin')
  @Scope('judger')
  async getProblem (ctx: APIContext, problemId: string) {
    return this.manager.findOneOrFail(Problem, problemId, { select: ['id', 'data', 'type'], relations: ['files', 'files.raw'] })
  }

  @Scope('admin')
  @Scope('judger')
  async getSolution (ctx: APIContext, solutionId: string) {
    return this.manager.findOneOrFail(Solution, solutionId, { select: ['id', 'data', 'type'], relations: ['files', 'files.raw'] })
  }

  @Scope('admin')
  @Scope('judger')
  async updateSolution (@context ctx: APIContext, solutionId: string, @optional state?: SolutionState, @optional status?: string, @optional details?: string) {
    const solution = await this.manager.findOneOrFail(Solution, solutionId)
    optionalSet(solution, 'state', state)
    optionalSet(solution, 'status', status)
    optionalSet(solution, 'details', details)
    await this.manager.save(solution)
  }

  async _validateToken (ctx: APIContext, token: string) {
    return !!await this.manager.count(Judger, { token })
  }

  async _validateTokenOrFail (ctx: APIContext, token: string) {
    if (!await this._validateToken(ctx, token)) throw new Error(E_ACCESS)
  }
}
