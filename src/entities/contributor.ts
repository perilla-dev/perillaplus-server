import { Column, Entity, Index, ManyToOne } from 'typeorm'
import { DIM_ENTITIES, STG_SRV_ENTITY } from '../constants'
import { injectMutiple, stage } from '../manager'
import { Base } from './base'
import { Problem } from './problem'
import { User } from './user'

@Entity()
@Index(['userId', 'problemId'], { unique: true })
export class Contributor extends Base {
  // Relations
  @Column() userId!: string
  @ManyToOne(() => User, e => e.contributors)
  user?: User

  @Column() problemId!: string
  @ManyToOne(() => Problem, e => e.contributors)
  problem?: Problem
}

stage(STG_SRV_ENTITY).step(() => {
  injectMutiple(DIM_ENTITIES).provide(Contributor)
})
