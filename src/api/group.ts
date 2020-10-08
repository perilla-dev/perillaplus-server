import { getManager } from 'typeorm'
import { Group } from '../entities'
import { BaseAPI } from './base'
import { Controller, Scope } from './decorators'

@Controller('group')
export class GroupAPI extends BaseAPI {
  @Scope('public')
  async find (name: string) {
    const m = getManager()
    return m.findOneOrFail(Group, { name })
  }

  @Scope('public')
  async get (id: string) {
    const m = getManager()
    return m.findOneOrFail(Group, id)
  }
}
