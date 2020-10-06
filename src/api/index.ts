import { DI_API } from '../constants'
import { inject } from '../manager'
import { APIHub } from './hub'
export { APIHub } from './hub'

inject<APIHub>(DI_API).provide(new APIHub())
