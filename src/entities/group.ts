import { Column, Entity, OneToMany } from 'typeorm'
import { STG_SRV_ENTITY, DIM_ENTITIES } from '../constants'
import { stage, injectMutiple } from '../manager'
import { Base } from './base'
import { Competition } from './competition'
import { Problem } from './problem'

@Entity()
export class Group extends Base {
  @Column({ unique: true })
  name!: string

  @Column()
  displayname!: string

  @Column()
  description!: string

  // Relations
  @OneToMany(() => Problem, e => e.group)
  problems?: Problem[]

  @OneToMany(() => Competition, e => e.group)
  competitions?: Competition[]
}

stage(STG_SRV_ENTITY).step(() => {
  injectMutiple(DIM_ENTITIES).provide(Group)
})
