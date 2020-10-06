import { Entity, ManyToOne } from 'typeorm'
import { STG_SRV_ENTITY, DIM_ENTITIES } from '../constants'
import { stage, injectMutiple } from '../manager'
import { Base } from './base'
import { Competition } from './competition'
import { User } from './user'

@Entity()
export class Participatant extends Base {
  // Relations
  @ManyToOne(() => User, e => e.participatants)
  user?: User

  @ManyToOne(() => Competition, e => e.participatants)
  competition?: Competition
}

stage(STG_SRV_ENTITY).step(() => {
  injectMutiple(DIM_ENTITIES).provide(Participatant)
})
