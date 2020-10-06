import { Column, ManyToOne } from 'typeorm'
import { Base } from './base'
import { User } from './user'

export class Member extends Base {
  @Column()
  admin!: boolean

  // Relations
  @ManyToOne(() => User, e => e.members)
  user?: User
}
