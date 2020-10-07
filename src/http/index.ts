import chalk from 'chalk'
import fastify, { FastifyPluginAsync } from 'fastify'
import fastifyStatic from 'fastify-static'
import path from 'path'
import { DIM_APIS, DI_ARGV, ENV_FRONTENDPATH, STG_SRV_HTTP } from '../constants'
import { inject, injectMutiple, stage } from '../manager'

stage(STG_SRV_HTTP).step(async () => {
  const server = fastify({ logger: false })

  const plugins = injectMutiple<{ plugin: FastifyPluginAsync, options: any }>(DIM_APIS).get()
  for (const { plugin, options } of plugins) {
    server.register(plugin, options)
  }

  if (ENV_FRONTENDPATH) {
    server.register(fastifyStatic, { root: path.resolve(ENV_FRONTENDPATH) })
  }

  const port: number = inject<any>(DI_ARGV).get().port
  await server.listen(port)
  console.log(server.printRoutes())
  console.log(chalk.green('Fastify server listening on:', port))
}, 'Start fastify server')
