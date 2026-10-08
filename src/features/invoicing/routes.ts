import { lazy } from 'react'
import type { Routes } from '@/@types/routes'

export const invoicingRoutes: Routes = [
    {
        key: 'settings.companyConfig',
        path: '/settings/company-config',
        component: lazy(() => import('./pages/CompanyConfigPage')),
        authority: ['user:manage'],
    },
    {
        key: 'settings.certificates',
        path: '/settings/certificates',
        component: lazy(() => import('./pages/CertificatesPage')),
        authority: ['user:manage'],
    },
]
