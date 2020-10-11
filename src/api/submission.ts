import { E_ACCESS } from '../constants'
import { Submission } from '../entities'
import { BaseAPI } from './base'
import { APIContext, Controller } from './decorators'

@Controller('submission')
export class SubmissionAPI extends BaseAPI {
  async canViewOrFail (ctx: APIContext, submission: Submission) {
    if (ctx.scope === 'public' && !(submission.pub || submission.userId === ctx.userId)) {
      await this.hub.problem.canManageOrFail(ctx, submission.problemId)
    }
  }

  async canManageOrFail (ctx: APIContext, submission: Submission) {
    if (ctx.scope === 'public') {
      if (ctx.userId !== submission.userId) throw new Error(E_ACCESS)
    }
  }
}
