import type { TenantSummary } from '@/@types/auth'

/** Cómo se nombra una empresa en la interfaz: su nombre comercial, si tiene. */
export const tenantDisplayName = (tenant: TenantSummary): string =>
    tenant.tradeName || tenant.legalName
