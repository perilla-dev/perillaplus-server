import { Entity, ManyToOne } from 'typeorm'
import { Base } from './base'
import { Competition } from './competition'
import { User } from './user'

@Entity()
export class Participatant extends Base {
  // Relations
  @ManyToOne(() => User, e => e.participatants)
  user?: User

  @ManyToOne(() => Competition, e => e.participatants)
  competition?: Competition
}
