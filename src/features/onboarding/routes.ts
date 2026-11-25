import { lazy } from 'react'
import type { Routes } from '@/@types/routes'

export const onboardingRoutes: Routes = [
    {
        key: 'settings.onboarding',
        path: '/settings/onboarding',
        component: lazy(() => import('./pages/OnboardingPage')),
        // Perfil fiscal y certificado son del administrador de la empresa
        authority: ['user:manage'],
    },
]
