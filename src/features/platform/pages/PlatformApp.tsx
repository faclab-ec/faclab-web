import { Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'
import ThemeModeToggle from '@/components/template/ThemeModeToggle'
import { lazy, Suspense } from 'react'
import Loading from '@/components/shared/Loading'
import {
    usePlatformSignedIn,
    usePlatformStore,
} from '../store/usePlatformStore'
import { usePlatformSignOut } from '../hooks/usePlatform'

const SignInPage = lazy(() => import('./PlatformSignInPage'))
const TenantsPage = lazy(() => import('./PlatformTenantsPage'))
const TenantPage = lazy(() => import('./PlatformTenantPage'))

/** La consola solo se ve con un token de plataforma vigente */
const Shell = () => {
    const navigate = useNavigate()
    const signedIn = usePlatformSignedIn()
    const operator = usePlatformStore((state) => state.operatorName)
    const signOut = usePlatformSignOut()

    if (!signedIn) return <Navigate replace to="/platform/sign-in" />

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
                <span className="font-semibold">Faclab · Plataforma</span>
                <div className="flex items-center gap-3">
                    <span className="hidden text-sm text-gray-500 sm:inline">
                        {operator}
                    </span>
                    <ThemeModeToggle />
                    <Button
                        size="sm"
                        variant="plain"
                        onClick={() => {
                            signOut()
                            navigate('/platform/sign-in', { replace: true })
                        }}
                    >
                        Salir
                    </Button>
                </div>
            </header>
            <main className="mx-auto max-w-6xl p-4 sm:p-6">
                <Outlet />
            </main>
        </div>
    )
}

/**
 * La consola de plataforma (S8.5), bajo `/platform`: su propio ingreso, su
 * propio token y su propio diseño; no comparte sesión con las empresas.
 */
const PlatformApp = () => (
    <Suspense fallback={<Loading loading />}>
        <Routes>
            <Route path="sign-in" element={<SignInPage />} />
            <Route element={<Shell />}>
                <Route path="tenants" element={<TenantsPage />} />
                <Route path="tenants/:id" element={<TenantPage />} />
                <Route path="*" element={<Navigate replace to="tenants" />} />
            </Route>
        </Routes>
    </Suspense>
)

export default PlatformApp
