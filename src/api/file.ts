import { createReadStream } from 'fs-extra'
import path from 'path'
import { DI_ARGV } from '../constants'
import { File, Problem, Submission } from '../entities'
import { inject } from '../manager'
import { optionalSet } from '../misc'
import { BaseAPI } from './base'
import { APIContext, context, Controller, optional, Scope } from './decorators'
import { APIHub } from './hub'

@Controller('file')
export class FileAPI extends BaseAPI {
  private _fileRoot

  constructor (hub: APIHub) {
    super(hub)

    const { dataDir } = inject<{ dataDir: string }>(DI_ARGV).get()
    this._fileRoot = path.resolve(dataDir, 'managed')
  }

  @Scope('public')
  async get (@context ctx: APIContext, id: string) {
    const file = await this.manager.findOneOrFail(File, id)
    await this._canViewOrFail(ctx, file)
    return file
  }

  @Scope('public')
  async download (@context ctx: APIContext, id: string) {
    const file = await this.manager.findOneOrFail(File, id, { relations: ['raw'] })
    await this._canViewOrFail(ctx, file)
    const realpath = path.join(this._fileRoot, file.raw!.hash)
    return createReadStream(realpath)
  }

  @Scope('public')
  async listByProblem (@context ctx: APIContext, problemId: string) {
    const problem = await this.manager.findOneOrFail(Problem, problemId)
    await this.hub.problem.canViewOrFail(ctx, problem)
    return this.manager.find(File, { problemId })
  }

  @Scope('public')
  async listBySubmission (@context ctx: APIContext, submissionId: string) {
    const submission = await this.manager.findOneOrFail(Submission, submissionId)
    await this.hub.submission._canViewOrFail(ctx, submission)
    return this.manager.find(File, { submissionId })
  }

  @Scope('public')
  async createInProblem (@context ctx: APIContext, problemId: string, rawId: string, path: string, pub: boolean) {
    await this.hub.problem.canManageOrFail(ctx, problemId)
    await this.manager.transaction(async m => {
      const file = new File()
      file.path = path
      file.pub = pub
      file.problemId = problemId
      file.rawId = rawId
      await m.save(file)
      // Touch the problem
      await m.update(Problem, problemId, { updated: Date.now() })
      return file.id
    })
  }

  @Scope('public')
  async remove (@context ctx: APIContext, id: string) {
    const file = await this.manager.findOneOrFail(File, id)
    await this._canManageOrFail(ctx, file)
    await this.manager.remove(file)
  }

  @Scope('public')
  async updateVisibility (@context ctx: APIContext, id: string, @optional pub?: boolean) {
    const file = await this.manager.findOneOrFail(File, id)
    await this._canManageOrFail(ctx, file)
    optionalSet(file, 'pub', pub)
    await this.manager.save(file)
  }

  async _canManageOrFail (ctx: APIContext, file: File) {
    if (ctx.scope === 'public') {
      if (file.problemId) {
        await this.hub.problem.canManageOrFail(ctx, file.problemId)
      } else {
        const submission = await this.manager.findOneOrFail(Submission, file.submissionId)
        await this.hub.submission._canManageOrFail(ctx, submission)
      }
    }
  }

  async _canViewOrFail (ctx: APIContext, file: File) {
    if (ctx.scope === 'public') {
      if (file.problemId) {
        if (file.pub) {
          const problem = await this.manager.findOneOrFail(Problem, file.problemId)
          await this.hub.problem.canViewOrFail(ctx, problem)
        } else {
          await this.hub.problem.canManageOrFail(ctx, file.problemId)
        }
      } else {
        const submission = await this.manager.findOneOrFail(Submission, file.submissionId)
        if (file.pub) {
          await this.hub.submission._canViewOrFail(ctx, submission)
        } else {
          await this.hub.submission._canManageOrFail(ctx, submission)
        }
      }
    }
  }
}
