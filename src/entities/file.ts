import { Column, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { STG_SRV_ENTITY, DIM_ENTITIES } from '../constants'
import { stage, injectMutiple } from '../manager'
import { Problem } from './problem'
import { Solution } from './solution'

@Entity()
export class RawFile {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ unique: true })
  hash!: string

  @OneToMany(() => File, e => e.raw)
  files?: File[]
}

@Entity()
@Index(['path', 'problemId'], { unique: true })
@Index(['path', 'solutionId'], { unique: true })
export class File {
  @PrimaryGeneratedColumn('uuid')
  readonly id!: string

  @Column()
  path!: string

  // true  -> anyone who can view the problem / solution can access the file
  // false -> only contributors & judgers can access the file
  @Column()
  pub!: boolean

  // Relations
  @Column({ nullable: true }) problemId?: string
  @ManyToOne(() => Problem, e => e.files, { onDelete: 'CASCADE' })
  problem?: Problem

  @Column({ nullable: true }) solutionId?: string
  @ManyToOne(() => Solution, e => e.files, { onDelete: 'CASCADE' })
  solution?: Solution

  @Column({ select: false }) rawId?: string
  @ManyToOne(() => RawFile, e => e.files, { onDelete: 'RESTRICT' })
  raw?: RawFile
}

stage(STG_SRV_ENTITY).step(() => {
  injectMutiple(DIM_ENTITIES).provide(RawFile).provide(File)
})
