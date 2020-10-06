import { Entity, ManyToOne } from 'typeorm'
import { Base } from './base'
import { User } from './user'

@Entity()
export class Contributor extends Base {
  // Relations
  @ManyToOne(() => User, e => e.contributors)
  user?: User
}
