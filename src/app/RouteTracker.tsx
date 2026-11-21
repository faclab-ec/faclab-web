import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { setRoute } from '@shared/lib/telemetry'
import { routePattern } from '@app/routes/routePattern'

/** Avisa a la telemetría cada cambio de pantalla con su patrón (S7.3) */
const RouteTracker = () => {
    const { pathname } = useLocation()

    useEffect(() => {
        setRoute(routePattern(pathname))
    }, [pathname])

    return null
}

export default RouteTracker
