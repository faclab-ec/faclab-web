import { useNavigate } from 'react-router-dom'
import { HiOutlineLockClosed } from 'react-icons/hi'
import Button from '@/components/ui/Button'
import appConfig from '@/configs/app.config'

const { authenticatedEntryPath } = appConfig

const AccessDeniedPage = () => {
    const navigate = useNavigate()
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-3xl text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                <HiOutlineLockClosed />
            </span>
            <div>
                <h1>Sin acceso</h1>
                <p className="mt-1 text-gray-500 dark:text-gray-400">
                    No tienes permiso para ver esta página.
                </p>
            </div>
            <Button
                variant="solid"
                onClick={() => navigate(authenticatedEntryPath)}
            >
                Volver al inicio
            </Button>
        </div>
    )
}

export default AccessDeniedPage
