import { PrimaryGeneratedColumn, Column, BeforeInsert } from 'typeorm'

export abstract class Base {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ update: false })
  created!: number

  @BeforeInsert()
  private setCreated () {
    this.created = Date.now()
  }
}
