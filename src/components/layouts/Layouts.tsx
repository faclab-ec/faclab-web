import { lazy, Suspense } from 'react'
import Loading from '@/components/shared/Loading'
import useAuth from '@/utils/hooks/useAuth'
import MustChangePasswordGuard from '@/components/route/MustChangePasswordGuard'

const AppLayout = lazy(() => import('./AppLayout'))
const AuthLayout = lazy(() => import('./AuthLayout'))

const Layout = () => {
    const { authenticated } = useAuth()

    return (
        <Suspense
            fallback={
                <div className="flex flex-auto flex-col h-[100vh]">
                    <Loading loading={true} />
                </div>
            }
        >
            <MustChangePasswordGuard />
            {authenticated ? <AppLayout /> : <AuthLayout />}
        </Suspense>
    )
}

export default Layout
