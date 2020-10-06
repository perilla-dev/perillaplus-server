import { Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { Problem } from './problem'
import { Submission } from './submission'

@Entity()
export class RawFile {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @OneToMany(() => File, e => e.raw)
  files?: File[]
}

@Entity()
export class File {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @ManyToOne(() => Problem, e => e.files)
  problem?: Problem

  @ManyToOne(() => Submission, e => e.files)
  submission?: Submission

  @ManyToOne(() => RawFile, e => e.files)
  raw?: RawFile
}
