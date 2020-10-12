import { Transform, TransformCallback, TransformOptions } from 'stream'
import crypto from 'crypto'

type BufferEncoding = 'ascii' | 'utf8' | 'utf-8' | 'utf16le' | 'ucs2' | 'ucs-2' | 'base64' | 'latin1' | 'binary' | 'hex'

export class HashStream extends Transform {
  private _hash

  constructor (opts?: TransformOptions) {
    super(opts)
    this._hash = crypto.createHash('SHA3-256')
  }

  _transform (chunk: any, encoding: BufferEncoding, callback: TransformCallback) {
    this._hash.update(chunk)
    this.push(chunk)
    callback()
  }

  digest () {
    return this._hash.digest('hex')
  }
}
