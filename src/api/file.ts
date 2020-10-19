import { createReadStream } from 'fs-extra'
import path from 'path'
import { DI_ARGV } from '../constants'
import { File, Problem, Solution } from '../entities'
import { inject } from '../manager'
import { ensureAccess, optionalSet } from '../misc'
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
  async get (@context ctx: APIContext, fileId: string) {
    const file = await this.manager.findOneOrFail(File, fileId)
    await ensureAccess(this._canView(ctx, file))

    return file
  }

  @Scope('public')
  async download (@context ctx: APIContext, fileId: string) {
    const file = await this.manager.findOneOrFail(File, fileId, { relations: ['raw'] })
    await ensureAccess(this._canView(ctx, file))

    const realpath = path.join(this._fileRoot, file.raw!.hash)
    return createReadStream(realpath)
  }

  @Scope('public')
  async listByProblem (@context ctx: APIContext, problemId: string) {
    const problem = await this.manager.findOneOrFail(Problem, problemId)
    await ensureAccess(this.hub.problem._canView(ctx, problem))

    return this.manager.find(File, { problemId })
  }

  @Scope('public')
  async listBySolution (@context ctx: APIContext, solutionId: string) {
    const solution = await this.manager.findOneOrFail(Solution, solutionId)
    await ensureAccess(this.hub.solution._canView(ctx, solution))

    return this.manager.find(File, { solutionId })
  }

  @Scope('public')
  async createInProblem (@context ctx: APIContext, problemId: string, rawId: string, path: string, pub: boolean) {
    await ensureAccess(this.hub.problem._canManage(ctx, problemId))

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
  async remove (@context ctx: APIContext, fileId: string) {
    const file = await this.manager.findOneOrFail(File, fileId)
    await ensureAccess(this._canManage(ctx, file))

    await this.manager.remove(file)
  }

  @Scope('public')
  async updateVis (@context ctx: APIContext, fileId: string, @optional pub?: boolean) {
    const file = await this.manager.findOneOrFail(File, fileId)
    await ensureAccess(this._canManage(ctx, file))

    optionalSet(file, 'pub', pub)
    await this.manager.save(file)
  }

  async _canManage (ctx: APIContext, file: File) {
    if (ctx.scope === 'public') {
      if (file.problemId) {
        return this.hub.problem._canManage(ctx, file.problemId)
      } else {
        const solution = await this.manager.findOneOrFail(Solution, file.solutionId)
        return this.hub.solution._canManage(ctx, solution)
      }
    }
    return true
  }

  async _canView (ctx: APIContext, file: File) {
    if (ctx.scope === 'public') {
      if (file.problemId) {
        if (file.pub) {
          const problem = await this.manager.findOneOrFail(Problem, file.problemId)
          return this.hub.problem._canView(ctx, problem)
        } else {
          return this.hub.problem._canManage(ctx, file.problemId)
        }
      } else {
        const solution = await this.manager.findOneOrFail(Solution, file.solutionId)
        if (file.pub) {
          return this.hub.solution._canView(ctx, solution)
        } else {
          return this.hub.solution._canManage(ctx, solution)
        }
      }
    }
    return true
  }
}
