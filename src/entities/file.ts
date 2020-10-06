import { Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { STG_SRV_ENTITY, DIM_ENTITIES } from '../constants'
import { stage, injectMutiple } from '../manager'
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

stage(STG_SRV_ENTITY).step(() => {
  injectMutiple(DIM_ENTITIES).provide(RawFile).provide(File)
})
