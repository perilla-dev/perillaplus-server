import { Matches } from 'class-validator'
import { Column, Entity, Index, ManyToOne, OneToMany } from 'typeorm'
import { STG_SRV_ENTITY, DIM_ENTITIES } from '../constants'
import { stage, injectMutiple } from '../manager'
import { Base } from './base'
import { Competition } from './competition'
import { File } from './file'
import { Group } from './group'
import { Solution } from './solution'
import { User } from './user'

@Entity()
@Index(['name', 'groupId'], { unique: true })
export class Problem extends Base {
  @Column()
  @Matches(/^[a-z0-9-]+$/)
  name!: string

  @Column()
  disp!: string

  @Column()
  desc!: string

  @Column()
  tags!: string

  @Column({ default: '' })
  data!: string

  @Column()
  type!: string

  @Column()
  pub!: boolean

  // Relations
  @Column() groupId!: string
  @ManyToOne(() => Group, e => e.problems, { onDelete: 'CASCADE' })
  group?: Group

  @Column({ nullable: true }) competitionId?: string
  @ManyToOne(() => Competition, e => e.problems, { onDelete: 'CASCADE' })
  competition?: Competition

  @OneToMany(() => File, e => e.problem)
  files?: File[]

  @OneToMany(() => Contributor, e => e.problem)
  contributors?: Contributor[]

  @OneToMany(() => Solution, e => e.problem)
  solutions?: Solution[]
}

@Entity()
@Index(['userId', 'problemId'], { unique: true })
export class Contributor extends Base {
  // Relations
  @Column({ select: false }) userId?: string
  @ManyToOne(() => User, e => e.contributors, { onDelete: 'CASCADE' })
  user?: User

  @Column({ select: false }) problemId?: string
  @ManyToOne(() => Problem, e => e.contributors, { onDelete: 'CASCADE' })
  problem?: Problem
}

stage(STG_SRV_ENTITY).step(() => {
  injectMutiple(DIM_ENTITIES).provide(Problem).provide(Contributor)
})
