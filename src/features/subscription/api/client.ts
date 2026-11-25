import appConfig from '@/configs/app.config'
import { httpClient } from '@shared/lib/http/httpClient'
import type { DataResponse } from '@/@types/api'
import type { Subscription } from '../model/types'

const BASE = `${appConfig.inventoryApiHost}/subscription`

/** Plan, estado de la suscripción y uso de la empresa (S8.4) */
export const getSubscription = () =>
    httpClient.get<DataResponse<Subscription>>(BASE)
