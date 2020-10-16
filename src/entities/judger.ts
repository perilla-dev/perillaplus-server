import { Matches } from 'class-validator'
import { Column, Entity, OneToMany } from 'typeorm'
import { Base } from './base'
import { Submission } from './submission'

@Entity()
export class Judger extends Base {
  @Column({ unique: true })
  @Matches(/^[a-z0-9-]+$/)
  name!: string

  @Column()
  disp!: string

  @Column()
  supportedProblemTypes!: string

  @Column({ select: false })
  token!: string

  @OneToMany(() => Submission, e => e.judger)
  submissions?: Submission[]
}
