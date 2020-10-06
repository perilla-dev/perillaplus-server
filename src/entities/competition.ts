import { Entity, ManyToOne, OneToMany } from 'typeorm'
import { STG_SRV_ENTITY, DIM_ENTITIES } from '../constants'
import { stage, injectMutiple } from '../manager'
import { Base } from './base'
import { Group } from './group'
import { Participatant } from './participatant'
import { Problem } from './problem'

@Entity()
export class Competition extends Base {
  // Relations
  @ManyToOne(() => Group, e => e.competitions)
  group?: Group

  @OneToMany(() => Problem, e => e.competition)
  problems?: Problem[]

  @OneToMany(() => Participatant, e => e.competition)
  participatants?: Participatant[]
}

stage(STG_SRV_ENTITY).step(() => {
  injectMutiple(DIM_ENTITIES).provide(Competition)
})
