import { keepPreviousData, useQuery } from '@tanstack/react-query'
import * as api from '../api/client'
import type { AuditLogParams } from '../model/types'

const AUDIT_LOG_KEY = ['audit-log'] as const

export const useAuditLog = (params?: AuditLogParams) =>
    useQuery({
        queryKey: [...AUDIT_LOG_KEY, params],
        queryFn: async () => {
            const body = await api.listAuditLog(params)
            return { items: body.data, pagination: body.meta.pagination }
        },
        placeholderData: keepPreviousData,
    })
