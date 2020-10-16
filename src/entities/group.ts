import { IsEmail, IsInt, Matches, Max, Min } from 'class-validator'
import { Column, Entity, Index, ManyToOne, OneToMany } from 'typeorm'
import { STG_SRV_ENTITY, DIM_ENTITIES } from '../constants'
import { stage, injectMutiple } from '../manager'
import { Base } from './base'
import { User } from './user'
import { Competition } from './competition'
import { Notice } from './notice'
import { Problem } from './problem'

export enum MemberRole {
  owner,
  admin,
  member
}

@Entity()
export class Group extends Base {
  @Column({ unique: true })
  @Matches(/^[a-z0-9-]+$/)
  name!: string

  @Column()
  disp!: string

  @Column()
  desc!: string

  @Column({ unique: true })
  @IsEmail()
  email!: string

  @Column({ default: false })
  memberCreateProblem!: boolean

  // Relations
  @OneToMany(() => Member, e => e.group)
  members?: Member[]

  @OneToMany(() => Problem, e => e.group)
  problems?: Problem[]

  @OneToMany(() => Competition, e => e.group)
  competitions?: Competition[]

  @OneToMany(() => Notice, e => e.group)
  notices?: Notice[]
}

@Entity()
@Index(['userId', 'groupId'], { unique: true })
export class Member extends Base {
  @Column()
  @IsInt() @Min(0) @Max(2)
  role!: MemberRole

  // Relations
  @Column({ select: false }) userId?: string
  @ManyToOne(() => User, e => e.members, { onDelete: 'CASCADE' })
  user?: User

  @Column({ select: false }) groupId?: string
  @ManyToOne(() => Group, e => e.members, { onDelete: 'CASCADE' })
  group?: Group
}

stage(STG_SRV_ENTITY).step(() => {
  injectMutiple(DIM_ENTITIES).provide(Group).provide(Member)
})
