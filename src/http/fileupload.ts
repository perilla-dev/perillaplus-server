import { FastifyPluginAsync } from 'fastify'
import { getManager } from 'typeorm'
import { DI_ARGV, E_ACCESS } from '../constants'
import { RawFile } from '../entities'
import { getAPIHub } from '../misc'
import { HashStream } from '../misc/hash'
import fastifyMultipart from 'fastify-multipart'
import tmp from 'tmp-promise'
import fs from 'fs-extra'
import path from 'path'
import { inject } from '../manager'

export const fileUpload: FastifyPluginAsync = async server => {
  const hub = getAPIHub()
  const m = getManager()

  const { dataDir } = inject<{ dataDir: string }>(DI_ARGV).get()
  const FILE_ROOT = path.resolve(dataDir, 'managed')
  await fs.ensureDir(FILE_ROOT)

  server.register(fastifyMultipart, {
    limits: {
      files: 1
    }
  })

  server.get('/', async () => 'File Upload Endpoint')

  server.post('/', async req => {
    try {
      const token = req.headers['x-access-token']
      if (!token || typeof token !== 'string') { throw new Error(E_ACCESS) }
      await hub.user._validateTokenOrFail(token)
      const data = await req.file()
      const tmpfile = await tmp.file()
      const hasher = new HashStream()
      await new Promise<void>((resolve, reject) => {
        data.file
          .pipe(hasher)
          .pipe(fs.createWriteStream(tmpfile.path))
          .on('finish', () => resolve()).on('error', e => reject(e))
      })
      const hash = hasher.digest()
      let file = await m.findOne(RawFile, { hash })
      if (file) {
        await tmpfile.cleanup()
      } else {
        const dst = path.join(FILE_ROOT, hash)
        await fs.move(tmpfile.path, dst)
        file = new RawFile()
        file.hash = hash
        await m.save(file)
      }
      return { ok: 1, result: file.id }
    } catch (e) {
      return { ok: 0, result: e.message }
    }
  })
}
