import { E_ACCESS } from '../constants'
import { Judger } from '../entities'
import { BaseAPI } from './base'
import { APIContext, Controller } from './decorators'

@Controller('judger')
export class JudgerAPI extends BaseAPI {
  _validateToken (ctx: APIContext, token: string) {
    return !!this.manager.count(Judger, { token })
  }

  _validateTokenOrFail (ctx: APIContext, token: string) {
    if (!this._validateToken(ctx, token)) throw new Error(E_ACCESS)
  }
}
