import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { STG_SRV_ENTITY, DIM_ENTITIES } from '../constants'
import { stage, injectMutiple } from '../manager'
import { Problem } from './problem'
import { Submission } from './submission'

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
export class File {
  @PrimaryGeneratedColumn('uuid')
  readonly id!: string

  @Column()
  path!: string

  // true  -> anyone who can view the problem / submission can access the file
  // false -> only contributors & judgers can access the file
  @Column()
  pub!: boolean

  // Relations
  @Column({ nullable: true }) problemId?: string
  @ManyToOne(() => Problem, e => e.files)
  problem?: Problem

  @Column({ nullable: true }) submissionId?: string
  @ManyToOne(() => Submission, e => e.files)
  submission?: Submission

  @Column({ select: false }) rawId?: string
  @ManyToOne(() => RawFile, e => e.files)
  raw?: RawFile
}

stage(STG_SRV_ENTITY).step(() => {
  injectMutiple(DIM_ENTITIES).provide(RawFile).provide(File)
})
