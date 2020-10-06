import { Column, Entity, ManyToOne, OneToMany } from 'typeorm'
import { Base } from './base'
import { Competition } from './competition'
import { File } from './file'
import { Group } from './group'
import { Submission } from './submission'

@Entity()
export class Problem extends Base {
  @Column()
  name!: string

  @Column()
  content!: string

  @Column()
  data!: string

  @Column()
  type!: string

  // Relations
  @ManyToOne(() => Group, e => e.problems)
  group?: Group

  @ManyToOne(() => Competition, e => e.problems)
  competition?: Competition

  @OneToMany(() => File, e => e.problem)
  files?: File[]

  @OneToMany(() => Submission, e => e.problem)
  submissions?: Submission[]
}
