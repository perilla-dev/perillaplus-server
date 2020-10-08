import { DI_APIHUB } from '../constants'
import { inject } from '../manager'
import { APIHub } from './hub'
export * from './hub'

inject<APIHub>(DI_APIHUB).provide(new APIHub())
