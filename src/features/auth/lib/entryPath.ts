import appConfig from '@/configs/app.config'
import { ROLE } from '@/constants/roles.constant'
import type { Session } from '@/@types/auth'
import { safeRedirectPath } from './safeRedirect'

/**
 * Primera pantalla de una sesión recién abierta (login, elección o cambio de
 * empresa): el cambio de contraseña obligatorio, el POS para un cajero o la
 * ruta pedida.
 */
export const entryPathFor = (
    session: Session,
    redirect?: string | null
): string => {
    if (session.mustChangePassword) return '/change-password'
    if (session.role === ROLE.CASHIER) return '/pos'
    return safeRedirectPath(redirect, appConfig.authenticatedEntryPath)
}
