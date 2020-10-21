import { Matches } from 'class-validator'
import { Column, Entity, OneToMany } from 'typeorm'
import { STG_SRV_ENTITY, DIM_ENTITIES } from '../constants'
import { stage, injectMutiple } from '../manager'
import { FullTimestampEntity } from './base'
import { Solution } from './solution'

@Entity()
export class Judger extends FullTimestampEntity {
  @Column({ unique: true })
  @Matches(/^[a-z0-9-]+$/)
  name!: string

  @Column()
  disp!: string

  @Column({ select: false })
  token!: string

  @OneToMany(() => Solution, e => e.judger)
  solutions?: Solution[]
}

stage(STG_SRV_ENTITY).step(() => {
  injectMutiple(DIM_ENTITIES).provide(Judger)
})
