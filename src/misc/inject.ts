import { APIHub } from '../api'
import { DI_API } from '../constants'
import { inject } from '../manager'

export function getAPI () {
  return inject<APIHub>(DI_API).get()
}
