import { httpClient } from '@shared/lib/http/httpClient'
import appConfig from '@/configs/app.config'
import type { PaginatedResponse } from '@/@types/api'
import type { Stock, StockListParams } from '../model/types'

const HOST = appConfig.inventoryApiHost

export const getStock = (params?: StockListParams) =>
    httpClient.get<PaginatedResponse<Stock>>(`${HOST}/stock`, { params })
