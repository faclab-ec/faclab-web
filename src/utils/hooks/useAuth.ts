import { useIsAuthenticated } from '@/stores/useAuthStore'
import { useLogout } from '@features/auth'

function useAuth() {
    const authenticated = useIsAuthenticated()
    const logoutMutation = useLogout()

    const signOut = async (): Promise<void> => {
        await logoutMutation.mutateAsync()
    }

    return {
        authenticated,
        signOut,
    }
}

export default useAuth
