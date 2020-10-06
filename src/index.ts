import chalk from 'chalk'
import { DI_ARGV, STG_CLI_MAIN, STG_SRV_MAIN } from './constants'
import { execute, inject, stage } from './manager'
import { pkginfo } from './misc'

stage(STG_SRV_MAIN).step(async () => {
  console.log(chalk.green(`ZhangZisu.CN Hub ${pkginfo.version} successfully started`))
}, 'main function')

export const server = (argv: any) => {
  inject(DI_ARGV).provide(argv)
  return execute(STG_SRV_MAIN)
}
export const cli = (argv: any) => {
  inject(DI_ARGV).provide(argv)
  return execute(STG_CLI_MAIN)
}
