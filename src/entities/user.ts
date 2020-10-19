import { IsEmail, IsInt, Matches, Max, Min } from 'class-validator'
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm'
import { STG_SRV_ENTITY, DIM_ENTITIES } from '../constants'
import { stage, injectMutiple } from '../manager'
import { Base } from './base'
import { Contributor } from './problem'
import { Participatant } from './competition'
import { Solution } from './solution'
import { Member } from './group'

export enum UserRole {
  common,
  admin = 255
}

@Entity()
export class User extends Base {
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

  @Column()
  @IsInt() @Min(0) @Max(255)
  role!: UserRole

  @Column({ select: false })
  hash!: string

  @Column({ select: false })
  salt!: string

  // Relations
  @OneToMany(() => Member, e => e.user)
  members?: Member[]

  @OneToMany(() => Participatant, e => e.user)
  participatants?: Participatant[]

  @OneToMany(() => Contributor, e => e.user)
  contributors?: Contributor[]

  @OneToMany(() => Solution, e => e.user)
  solutions?: Solution[]

  @OneToMany(() => UserToken, e => e.user)
  tokens?: UserToken[]
}

@Entity()
export class UserToken extends Base {
  @Column({ select: false, unique: true })
  token!: string

  @Column() userId!: string
  @ManyToOne(() => User, e => e.tokens, { onDelete: 'CASCADE' })
  user?: User

  @Column()
  desc!: string
}

stage(STG_SRV_ENTITY).step(() => {
  injectMutiple(DIM_ENTITIES).provide(User).provide(UserToken)
})
