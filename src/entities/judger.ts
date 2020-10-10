import { Matches } from 'class-validator'
import { Column, Entity } from 'typeorm'
import { Base } from './base'

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
}
