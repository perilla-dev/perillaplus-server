import { Column, Entity, ManyToOne } from 'typeorm'
import { STG_SRV_ENTITY, DIM_ENTITIES } from '../constants'
import { stage, injectMutiple } from '../manager'
import { Base } from './base'
import { Group } from './group'

@Entity()
export class Notice extends Base {
  @Column({ unique: true })
  name!: string

  @Column()
  disp!: string

  @Column()
  desc!: string

  @Column({ nullable: true, select: false }) groupId?: string
  @ManyToOne(() => Group, e => e.notices)
  group?: Group
}

stage(STG_SRV_ENTITY).step(() => {
  injectMutiple(DIM_ENTITIES).provide(Notice)
})
