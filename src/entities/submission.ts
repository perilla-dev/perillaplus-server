import { Column, Entity, ManyToOne, OneToMany } from 'typeorm'
import { STG_SRV_ENTITY, DIM_ENTITIES } from '../constants'
import { stage, injectMutiple } from '../manager'
import { Base } from './base'
import { File } from './file'
import { Problem } from './problem'
import { User } from './user'

@Entity()
export class Submission extends Base {
  @Column()
  pub!: boolean

  // Relations
  @Column() problemId!: string
  @ManyToOne(() => Problem, e => e.submissions)
  problem?: Problem

  @Column() userId!: string
  @ManyToOne(() => User, e => e.submissions)
  user?: User

  @OneToMany(() => File, e => e.submission)
  files?: File[]
}

stage(STG_SRV_ENTITY).step(() => {
  injectMutiple(DIM_ENTITIES).provide(Submission)
})
