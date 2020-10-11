import { FastifyPluginAsync } from 'fastify'

export const fileUpload: FastifyPluginAsync = async server => {
  server.get('/', async req => req.ip)
}
