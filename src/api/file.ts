import { getManager } from 'typeorm'
import { E_UNIMPL } from '../constants'
import { File, Problem } from '../entities'
import { BaseAPI } from './base'
import { APIContext, context, Controller, Scope } from './decorators'

@Controller('file')
export class FileAPI extends BaseAPI {
  @Scope('public')
  async listByProblem (@context ctx: APIContext, problemId: string) {
    const m = getManager()
    const problem = await m.findOneOrFail(Problem, problemId)
    await this.hub.problem.canReadOrFail(ctx, problem)
    return m.find(File, { problemId })
  }

  @Scope('public')
  async download (@context ctx: APIContext, id: string) {
    const m = getManager()
    const file = await m.findOneOrFail(File, id, { relations: ['problem', 'submission'] })
    if (file.problemId) {
      // Problem file
      throw new Error(E_UNIMPL)
    } else {
      // Submission file
      throw new Error(E_UNIMPL)
    }
  }
}
