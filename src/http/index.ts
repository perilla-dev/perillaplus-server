import chalk from 'chalk'
import fastify, { FastifyPluginAsync } from 'fastify'
import fastifyStatic from 'fastify-static'
import path from 'path'
import { DI_ARGV, DI_HTTP_PUBAPI, ENV_FRONTENDPATH, STG_SRV_HTTP } from '../constants'
import { inject, stage } from '../manager'

stage(STG_SRV_HTTP).step(async () => {
  const server = fastify({ logger: false })
    .register(inject<FastifyPluginAsync>(DI_HTTP_PUBAPI).get(), { prefix: '/api' })

  if (ENV_FRONTENDPATH) {
    server.register(fastifyStatic, { root: path.resolve(ENV_FRONTENDPATH) })
  }

  const port: number = inject<any>(DI_ARGV).get().port
  await server.listen(port)
  console.log(chalk.green('Fastify server listening on:', port))
}, 'Start fastify server')
