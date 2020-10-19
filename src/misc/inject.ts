import { APIHub } from '../api'
import { DI_APIHUB } from '../constants'
import { inject } from '../manager'

export function getAPIHub () {
  return inject<APIHub>(DI_APIHUB).get()
}
