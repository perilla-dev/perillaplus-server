import { Matches } from 'class-validator'
import { Column, Entity, Index, ManyToOne, OneToMany } from 'typeorm'
import { STG_SRV_ENTITY, DIM_ENTITIES } from '../constants'
import { stage, injectMutiple } from '../manager'
import { Base } from './base'
import { Group } from './group'
import { Problem } from './problem'
import { User } from './user'

@Entity()
@Index(['name', 'groupId'], { unique: true })
export class Competition extends Base {
  @Column()
  @Matches(/^[a-z0-9-]+$/)
  name!: string

  @Column()
  disp!: string

  @Column()
  desc!: string

  @Column({ select: false })
  data!: string

  @Column()
  type!: string

  @Column()
  tags!: string

  // Relations
  @Column() groupId!: string
  @ManyToOne(() => Group, e => e.competitions)
  group?: Group

  @OneToMany(() => Problem, e => e.competition)
  problems?: Problem[]

  @OneToMany(() => Participatant, e => e.competition)
  participatants?: Participatant[]
}

@Entity()
@Index(['user', 'competition'], { unique: true })
export class Participatant extends Base {
  // Relations
  @Column() userId!: string
  @ManyToOne(() => User, e => e.participatants)
  user?: User

  @Column() competitionId!: string
  @ManyToOne(() => Competition, e => e.participatants)
  competition?: Competition
}

stage(STG_SRV_ENTITY).step(() => {
  injectMutiple(DIM_ENTITIES).provide(Competition).provide(Participatant)
})
