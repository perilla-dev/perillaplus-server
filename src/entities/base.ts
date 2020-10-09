import { PrimaryGeneratedColumn, Column, BeforeInsert, BeforeUpdate } from 'typeorm'

export abstract class Base {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ update: false })
  created!: number

  @Column()
  updated!: number

  @BeforeInsert()
  private setCreated () {
    this.created = Date.now()
    this.updated = Date.now()
  }

  @BeforeUpdate()
  private setUpdated () {
    this.updated = Date.now()
  }
}
