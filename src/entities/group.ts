import { Column, Entity, OneToMany } from 'typeorm'
import { Base } from './base'
import { Competition } from './competition'
import { Problem } from './problem'

@Entity()
export class Group extends Base {
  @Column({ unique: true })
  name!: string

  @Column()
  displayname!: string

  @Column()
  description!: string

  // Relations
  @OneToMany(() => Problem, e => e.group)
  problems?: Problem[]

  @OneToMany(() => Competition, e => e.group)
  competitions?: Competition[]
}
