import { Column, Entity, ManyToOne, OneToMany } from 'typeorm'
import { STG_SRV_ENTITY, DIM_ENTITIES } from '../constants'
import { stage, injectMutiple } from '../manager'
import { FullTimestampEntity } from './base'
import { File } from './file'
import { Problem, ProblemType } from './problem'
import { User } from './user'
import { Judger } from './judger'

export enum SolutionState {
  Queued,
  Running,
  Done
}

@Entity()
export class Solution extends FullTimestampEntity {
  @Column()
  state!: SolutionState

  @Column()
  status!: string

  @Column()
  details!: string

  @Column()
  data!: string

  @Column()
  pub!: boolean

  // Relations
  @Column() typeId!: string
  @ManyToOne(() => ProblemType, e => e.problems, { onDelete: 'RESTRICT' })
  type?: ProblemType

  @Column() problemId!: string
  @ManyToOne(() => Problem, e => e.solutions, { onDelete: 'CASCADE' })
  problem?: Problem

  @Column({ nullable: true }) judgerId?: string
  @ManyToOne(() => Judger, e => e.solutions, { onDelete: 'SET NULL' })
  judger?: Judger

  @Column() userId!: string
  @ManyToOne(() => User, e => e.solutions, { onDelete: 'CASCADE' })
  user?: User

  @OneToMany(() => File, e => e.solution)
  files?: File[]
}

stage(STG_SRV_ENTITY).step(() => {
  injectMutiple(DIM_ENTITIES).provide(Solution)
})
