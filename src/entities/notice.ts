import { Matches } from 'class-validator'
import { Column, Entity, Index, ManyToOne } from 'typeorm'
import { STG_SRV_ENTITY, DIM_ENTITIES } from '../constants'
import { stage, injectMutiple } from '../manager'
import { Base } from './base'
import { Group } from './group'

@Entity()
@Index(['name', 'groupId'], { unique: true })
export class Notice extends Base {
  @Column({ unique: true })
  @Matches(/^[a-z0-9-]+$/)
  name!: string

  @Column()
  disp!: string

  @Column()
  desc!: string

  @Column({ nullable: true }) groupId!: string
  @ManyToOne(() => Group, e => e.notices, { onDelete: 'CASCADE' })
  group?: Group
}

stage(STG_SRV_ENTITY).step(() => {
  injectMutiple(DIM_ENTITIES).provide(Notice)
})
