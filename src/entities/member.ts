import { Column, Entity, ManyToOne } from 'typeorm'
import { STG_SRV_ENTITY, DIM_ENTITIES } from '../constants'
import { stage, injectMutiple } from '../manager'
import { Base } from './base'
import { User } from './user'

@Entity()
export class Member extends Base {
  @Column()
  admin!: boolean

  // Relations
  @ManyToOne(() => User, e => e.members)
  user?: User
}

stage(STG_SRV_ENTITY).step(() => {
  injectMutiple(DIM_ENTITIES).provide(Member)
})
