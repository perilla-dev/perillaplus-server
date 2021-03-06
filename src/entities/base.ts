import { PrimaryGeneratedColumn, Column, BeforeInsert, BeforeUpdate } from 'typeorm'
import { validate } from 'class-validator'

export abstract class UUIDEntity {
  @PrimaryGeneratedColumn('uuid')
  readonly id!: string

  @BeforeInsert() @BeforeUpdate()
  public async validate () {
    const errors = await validate(this)
    if (errors.length > 0) { throw new Error('Validation failed') }
  }
}

export abstract class SimpleTimestampEntity extends UUIDEntity {
  @Column({ update: false })
  created!: number

  @BeforeInsert()
  private setCreated () {
    this.created = Date.now()
  }
}

export abstract class FullTimestampEntity extends UUIDEntity {
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
