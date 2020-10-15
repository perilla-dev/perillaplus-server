import { getManager } from 'typeorm'
import { E_ACCESS } from '../constants'
import { File, Problem, Submission, SubmissionState } from '../entities'
import { optionalSet } from '../misc'
import { BaseAPI } from './base'
import { APIContext, context, Controller, optional, schema, Scope, type } from './decorators'

interface ISubmissionFileDTO {
  rawId: string
  path: string
  pub: boolean
}

const SubmissionFileSchema = {
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

@Controller('submission')
export class SubmissionAPI extends BaseAPI {
  @Scope('public')
  @Scope('admin')
  @Scope('judger')
  async get (@context ctx: APIContext, id: string) {
    const m = getManager()
    const submission = await m.findOneOrFail(Submission, id, { relations: ['user', 'problem', 'files'] })
    await this.canViewOrFail(ctx, submission)
    return submission
  }

  @Scope('public')
  async listByProblem (@context ctx: APIContext, problemId: string) {
    const m = getManager()
    const problem = await m.findOneOrFail(Problem, problemId)
    await this.hub.problem.canViewOrFail(ctx, problem)
    return m.find(Submission, { where: { problemId }, relations: ['user'] })
  }

  @Scope('public')
  async createInProblem (@context ctx: APIContext, problemId: string, data: string, pub: boolean, @type('object') @schema(SubmissionFileSchema) files: ISubmissionFileDTO[]) {
    const m = getManager()
    const problem = await m.findOneOrFail(Problem, problemId)
    await this.hub.problem.canViewOrFail(ctx, problem)
    return m.transaction(async m => {
      const submission = new Submission()
      submission.state = SubmissionState.Pending
      submission.data = data
      submission.pub = pub
      submission.type = problem.type
      submission.problemId = problemId
      submission.userId = ctx.userId!
      await m.save(submission)
      for (const f of files) {
        const file = new File()
        file.path = f.path
        file.pub = f.pub
        file.rawId = f.rawId
        file.submissionId = submission.id
        await m.save(file)
      }
      return submission.id
    })
  }

  @Scope('public')
  async updateVisibility (@context ctx: APIContext, id: string, pub: boolean) {
    const m = getManager()
    const submission = await m.findOneOrFail(Submission, id)
    await this.canManageOrFail(ctx, submission)
    submission.pub = pub
    await m.save(submission)
  }

  @Scope('admin')
  @Scope('judger')
  async update (id: string, @optional state?: SubmissionState, @optional status?: string, @optional details?: string) {
    const m = getManager()
    const submission = await m.findOneOrFail(Submission, id)
    optionalSet(submission, 'state', state)
    optionalSet(submission, 'status', status)
    optionalSet(submission, 'details', details)
  }

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
