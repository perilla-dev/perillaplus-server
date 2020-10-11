import { getManager } from 'typeorm'
import { E_INVALID_ACTION, E_UNIMPL } from '../constants'
import { File, Problem, Submission } from '../entities'
import { optionalSet } from '../misc'
import { BaseAPI } from './base'
import { APIContext, context, Controller, optional, Scope } from './decorators'

@Controller('file')
export class FileAPI extends BaseAPI {
  @Scope('public')
  async listByProblem (@context ctx: APIContext, problemId: string) {
    const m = getManager()
    const problem = await m.findOneOrFail(Problem, problemId)
    await this.hub.problem.canViewOrFail(ctx, problem)
    return m.find(File, { problemId })
  }

  @Scope('public')
  async listBySubmission (@context ctx: APIContext, submissionId: string) {
    const m = getManager()
    const submission = await m.findOneOrFail(Submission, submissionId)
    await this.hub.submission.canViewOrFail(ctx, submission)
    return m.find(File, { submissionId })
  }

  @Scope('public')
  async download (@context ctx: APIContext, id: string) {
    const m = getManager()
    const file = await m.findOneOrFail(File, id, { relations: ['problem', 'submission'] })
    await this.canDownloadOrFail(ctx, file)
    throw new Error(E_UNIMPL)
  }

  @Scope('public')
  async createInProblem (@context ctx: APIContext, problemId: string, rawId: string, path: string, pub: boolean) {
    await this.hub.problem.canManageOrFail(ctx, problemId)
    const m = getManager()
    const file = new File()
    file.path = path
    file.pub = pub
    file.problemId = problemId
    file.rawId = rawId
    await m.save(file)
    return file.id
  }

  @Scope('public')
  async remove (@context ctx: APIContext, id: string) {
    const m = getManager()
    const file = await m.findOneOrFail(File, id)
    await this.canManageOrFail(ctx, file)
    await m.remove(file)
  }

  @Scope('public')
  async update (@context ctx: APIContext, id: string, @optional path?: string, @optional pub?: boolean) {
    const m = getManager()
    const file = await m.findOneOrFail(File, id)
    await this.canManageOrFail(ctx, file)
    optionalSet(file, 'path', path)
    optionalSet(file, 'pub', pub)
    await m.save(file)
  }

  async canManageOrFail (ctx: APIContext, file: File) {
    if (ctx.scope === 'public') {
      if (file.problemId) {
        await this.hub.problem.canManageOrFail(ctx, file.problemId)
      } else {
        throw new Error(E_INVALID_ACTION)
      }
    }
  }

  async canDownloadOrFail (ctx: APIContext, file: File) {
    const m = getManager()
    if (ctx.scope === 'public') {
      if (file.problemId) {
        if (file.pub) {
          const problem = await m.findOneOrFail(Problem, file.problemId)
          await this.hub.problem.canViewOrFail(ctx, problem)
        } else {
          await this.hub.problem.canManageOrFail(ctx, file.problemId)
        }
      } else {
        const submission = await m.findOneOrFail(Submission, file.submissionId)
        if (file.pub) {
          await this.hub.submission.canViewOrFail(ctx, submission)
        } else {
          await this.hub.submission.canManageOrFail(ctx, submission)
        }
      }
    }
  }
}
