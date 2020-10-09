import { Column, Entity, OneToMany } from 'typeorm'
import { STG_SRV_ENTITY, DIM_ENTITIES } from '../constants'
import { stage, injectMutiple } from '../manager'
import { Base } from './base'
import { Competition } from './competition'
import { Member } from './member'
import { Notice } from './notice'
import { Problem } from './problem'

@Entity()
export class Group extends Base {
  @Column({ unique: true })
  name!: string

  @Column()
  disp!: string

  @Column()
  desc!: string

  @Column({ unique: true })
  email!: string

  @Column({ default: false })
  memberCreateProblem!: boolean

  // Relations
  @OneToMany(() => Member, e => e.group)
  members?: Member[]

  @OneToMany(() => Problem, e => e.group)
  problems?: Problem[]

  @OneToMany(() => Competition, e => e.group)
  competitions?: Competition[]

  @OneToMany(() => Notice, e => e.group)
  notices?: Notice[]
}

stage(STG_SRV_ENTITY).step(() => {
  injectMutiple(DIM_ENTITIES).provide(Group)
})
