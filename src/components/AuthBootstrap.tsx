import { useEffect, type ReactNode } from 'react'
import { useAuthChannelSync, useMe, useRestoreSession } from '@features/auth'
import { useAccessToken, useSession } from '@/stores/useAuthStore'
import Loading from '@/components/shared/Loading'

const LEGACY_STORAGE_KEY = 'auth-storage'
const MIGRATION_FLAG = 'fc.migratedV2'

const migrateLegacyStorage = (): void => {
    if (typeof window === 'undefined') return
    try {
        if (window.localStorage.getItem(MIGRATION_FLAG)) return
        window.localStorage.removeItem(LEGACY_STORAGE_KEY)
        window.localStorage.setItem(MIGRATION_FLAG, '1')
    } catch {
        /* ignore */
    }
}

interface AuthBootstrapProps {
    children: ReactNode
}

const AuthBootstrap = ({ children }: AuthBootstrapProps) => {
    useEffect(() => {
        migrateLegacyStorage()
    }, [])

    const restoring = useRestoreSession()
    useAuthChannelSync()

    const accessToken = useAccessToken()
    const session = useSession()
    const { isLoading } = useMe()

    if (restoring || (accessToken && !session && isLoading)) {
        return <Loading loading={true} />
    }

    return <>{children}</>
}

export default AuthBootstrap
