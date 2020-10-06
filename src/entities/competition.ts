import { Entity, ManyToOne, OneToMany } from 'typeorm'
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
