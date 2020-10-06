import { pbkdf2, randomBytes } from 'crypto'
import { promisify } from 'util'

export const pbkdf2Async = promisify(pbkdf2)
export const randomBytesAsync = promisify(randomBytes)
