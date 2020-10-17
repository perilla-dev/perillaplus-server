import { Matches } from 'class-validator'
import { Column, Entity, OneToMany } from 'typeorm'
import { STG_SRV_ENTITY, DIM_ENTITIES } from '../constants'
import { stage, injectMutiple } from '../manager'
import { Base } from './base'
import { Submission } from './submission'

@Entity()
export class Judger extends Base {
  @Column({ unique: true })
  @Matches(/^[a-z0-9-]+$/)
  name!: string

  @Column()
  disp!: string

  @Column()
  supportedProblemTypes!: string

  @Column({ select: false })
  token!: string

  @OneToMany(() => Submission, e => e.judger)
  submissions?: Submission[]
}

stage(STG_SRV_ENTITY).step(() => {
  injectMutiple(DIM_ENTITIES).provide(Judger)
})
