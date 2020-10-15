import { PrimaryGeneratedColumn, Column, BeforeInsert, BeforeUpdate } from 'typeorm'
import { validate } from 'class-validator'

export abstract class Base {
  @PrimaryGeneratedColumn('uuid')
  readonly id!: string

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
    console.log('!!!')
    this.updated = Date.now()
  }

  @BeforeInsert() @BeforeUpdate()
  public async validate () {
    const errors = await validate(this)
    if (errors.length > 0) { throw new Error('Validation failed') }
  }
}
