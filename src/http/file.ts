import tmp from 'tmp-promise'
import path from 'path'
import fastifyMultipart from 'fastify-multipart'
import { FastifyPluginAsync } from 'fastify'
import { getManager } from 'typeorm'
import { createReadStream, createWriteStream, ensureDir, move } from 'fs-extra'
import { DI_ARGV, E_ACCESS, E_INVALID_ACTION } from '../constants'
import { File, RawFile } from '../entities'
import { ensureAccess, getAPIHub, HashStream } from '../misc'
import { inject } from '../manager'
import { APIContext } from '../api'

export const filePlugin: FastifyPluginAsync = async server => {
  const hub = getAPIHub()
  const m = getManager()

  const { dataDir } = inject<{ dataDir: string }>(DI_ARGV).get()
  const FILE_ROOT = path.resolve(dataDir, 'managed')
  await ensureDir(FILE_ROOT)

  server.register(fastifyMultipart, {
    limits: {
      files: 1
    }
  })

  server.get('/', async () => 'File Endpoint')

  server.post('/upload', async req => {
    try {
      const token = req.headers['x-access-token']
      if (!token || typeof token !== 'string') { throw new Error(E_ACCESS) }
      const ctx = new APIContext('public')
      ctx.userId = await hub.user._validateTokenOrFail(ctx, token)

      const data = await req.file()
      const tmpfile = await tmp.file()
      const hasher = new HashStream()
      await new Promise<void>((resolve, reject) => {
        data.file
          .pipe(hasher)
          .pipe(createWriteStream(tmpfile.path))
          .on('finish', () => resolve()).on('error', e => reject(e))
      })
      const hash = hasher.digest()
      let file = await m.findOne(RawFile, { hash })
      if (file) {
        await tmpfile.cleanup()
      } else {
        const dst = path.join(FILE_ROOT, hash)
        await move(tmpfile.path, dst)
        file = new RawFile()
        file.hash = hash
        await m.save(file)
      }
      return { ok: 1, result: file.id }
    } catch (e) {
      return { ok: 0, result: e.message }
    }
  })

  server.get('/download', async req => {
    // @ts-ignore
    const fileId = req.query.fileId
    if (!fileId || typeof fileId !== 'string') { throw new Error(E_INVALID_ACTION) }

    const token = req.headers['x-access-token']
    if (!token || typeof token !== 'string') { throw new Error(E_ACCESS) }
    const ctx = new APIContext('public')
    ctx.userId = await hub.user._validateTokenOrFail(ctx, token)

    const file = await m.findOneOrFail(File, fileId, { relations: ['raw'] })
    await ensureAccess(hub.file._canView(ctx, file))

    const realpath = path.join(FILE_ROOT, file.raw!.hash)
    return createReadStream(realpath)
  })

  // Judger-only RawFile Download API
  server.get('/raw', async req => {
    // @ts-ignore
    const rawId = req.query.rawId
    if (!rawId || typeof rawId !== 'string') { throw new Error(E_INVALID_ACTION) }

    const token = req.headers['x-access-token']
    if (!token || typeof token !== 'string') { throw new Error(E_ACCESS) }
    const ctx = new APIContext('judger')
    await hub.judger._validateTokenOrFail(ctx, token)

    const rawFile = await m.findOneOrFail(RawFile, rawId, { select: ['hash'] })
    const realpath = path.join(FILE_ROOT, rawFile.hash)
    return createReadStream(realpath)
  })
}
