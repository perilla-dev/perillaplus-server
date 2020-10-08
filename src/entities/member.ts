import { Column, Entity, ManyToOne } from 'typeorm'
import { STG_SRV_ENTITY, DIM_ENTITIES } from '../constants'
import { stage, injectMutiple } from '../manager'
import { Base } from './base'
import { Group } from './group'
import { User } from './user'

enum MemberRole {
  owner,
  admin,
  member
}

@Entity()
export class Member extends Base {
  @Column()
  role!: MemberRole

  // Relations
  @Column({ select: false }) userId?: string
  @ManyToOne(() => User, e => e.members)
  user?: User

  @Column({ select: false }) groupId?: string
  @ManyToOne(() => Group, e => e.members)
  group?: Group
}

stage(STG_SRV_ENTITY).step(() => {
  injectMutiple(DIM_ENTITIES).provide(Member)
})
