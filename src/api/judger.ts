import { E_ACCESS } from '../constants'
import { Judger } from '../entities'
import { BaseAPI } from './base'
import { Controller } from './decorators'

@Controller('judger')
export class JudgerAPI extends BaseAPI {
  _validateToken (token: string) {
    return !!this.manager.count(Judger, { token })
  }

  _validateTokenOrFail (token:string) {
    if (!this._validateToken(token)) throw new Error(E_ACCESS)
  }
}
