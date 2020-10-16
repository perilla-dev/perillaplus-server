import { DI_APIHUB, STG_SRV_APIHUB } from '../constants'
import { inject, stage } from '../manager'
import { APIHub } from './hub'
export { internalContext } from './decorators'
export { APIHub } from './hub'

stage(STG_SRV_APIHUB).step(() => {
  inject<APIHub>(DI_APIHUB).provide(new APIHub())
})
