import { Entity, ManyToOne, OneToMany } from 'typeorm'
import { Base } from './base'
import { File } from './file'
import { Problem } from './problem'
import { User } from './user'

@Entity()
export class Submission extends Base {
  @ManyToOne(() => Problem, e => e.submissions)
  problem?: Problem

  @ManyToOne(() => User, e => e.submissions)
  user?: User

  @OneToMany(() => File, e => e.submission)
  files?: File[]
}
