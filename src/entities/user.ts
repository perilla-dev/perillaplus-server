import { Column, Entity, ManyToOne, OneToMany } from 'typeorm'
import { Base } from './base'
import { Contributor } from './contributor'
import { Member } from './member'
import { Participatant } from './participatant'
import { Submission } from './submission'

@Entity()
export class User extends Base {
  @Column({ unique: true })
  name!: string

  @Column()
  displayname!: string

  @Column()
  description!: string

  @Column({ unique: true })
  email!: string

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

  @OneToMany(() => Submission, e => e.user)
  submissions?: Submission[]

  @OneToMany(() => UserToken, e => e.user)
  tokens?: UserToken[]
}

@Entity()
export class UserToken extends Base {
  @Column({ select: false, unique: true })
  token!: string

  @Column()
  userId!: string

  @ManyToOne(() => User, e => e.tokens)
  user?: User

  @Column()
  desc!: string
}
