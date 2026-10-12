import { useEffect } from 'react'
import { useBaseStore } from '@/stores'
import type { ComponentType } from 'react'

export type AppRouteProps = {
    component: ComponentType
    routeKey: string
}

/** Renderiza la página de una ruta y publica su clave (la usa el menú). */
const AppRoute = ({ component: Component, routeKey }: AppRouteProps) => {
    const setCurrentRouteKey = useBaseStore((state) => state.setCurrentRouteKey)

    useEffect(() => {
        setCurrentRouteKey(routeKey)
    }, [routeKey, setCurrentRouteKey])

    return <Component />
}

export default AppRoute
