import { Column, Entity, ManyToOne, OneToMany } from 'typeorm'
import { STG_SRV_ENTITY, DIM_ENTITIES } from '../constants'
import { stage, injectMutiple } from '../manager'
import { Base } from './base'
import { Group } from './group'
import { Participatant } from './participatant'
import { Problem } from './problem'

@Entity()
export class Competition extends Base {
  @Column()
  name!: string

  @Column()
  disp!: string

  @Column()
  desc!: string

  @Column({ select: false })
  data!: string

  @Column()
  type!: string

  @Column()
  tags!: string

  // Relations
  @Column() groupId!: string
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
