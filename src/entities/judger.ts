import { Column, Entity } from 'typeorm'
import { Base } from './base'

@Entity()
export class Judger extends Base {
  @Column()
  name!: string

  @Column()
  disp!: string

  @Column()
  supportedProblemTypes!: string

  @Column({ select: false })
  token!: string
}
