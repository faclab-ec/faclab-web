import appConfig from '@/configs/app.config'
import { httpClient } from '@shared/lib/http/httpClient'
import type { PaginatedResponse } from '@/@types/api'
import type { AuditEntry, AuditLogParams } from '../model/types'

const BASE = `${appConfig.inventoryApiHost}/audit-log`

// La sucursal se filtra solo con `branchId`: el core ignora X-Branch-Id aquí
export const listAuditLog = (params?: AuditLogParams) =>
    httpClient.get<PaginatedResponse<AuditEntry>>(BASE, { params })
