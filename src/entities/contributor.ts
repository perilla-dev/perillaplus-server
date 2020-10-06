import { Entity, ManyToOne } from 'typeorm'
import { DIM_ENTITIES, STG_SRV_ENTITY } from '../constants'
import { injectMutiple, stage } from '../manager'
import { Base } from './base'
import { User } from './user'

@Entity()
export class Contributor extends Base {
  // Relations
  @ManyToOne(() => User, e => e.contributors)
  user?: User
}

stage(STG_SRV_ENTITY).step(() => {
  injectMutiple(DIM_ENTITIES).provide(Contributor)
})
