import { E_ACCESS } from '../constants'
import { Judger } from '../entities'
import { BaseAPI } from './base'
import { Controller } from './decorators'

@Controller('judger')
export class JudgerAPI extends BaseAPI {
  validateToken (token: string) {
    return !!this.manager.count(Judger, { token })
  }

  validateTokenOrFail (token:string) {
    if (!this.validateToken(token)) throw new Error(E_ACCESS)
  }
}
