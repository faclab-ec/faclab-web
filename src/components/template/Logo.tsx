import { useId } from 'react'
import classNames from 'classnames'
import { APP_NAME } from '@/constants/app.constant'
import type { CommonProps } from '@/@types/common'

interface LogoMarkProps {
    /** Alto y ancho en píxeles */
    size?: number
    className?: string
}

/**
 * Isotipo de Faclab: un comprobante con un cubo de inventario. El contorno
 * del documento usa `currentColor`, así que sirve sobre fondo claro u oscuro.
 */
export const LogoMark = ({ size = 32, className }: LogoMarkProps) => {
    const gradientId = useId()

    return (
        <svg
            className={className}
            width={size}
            height={size}
            viewBox="0 0 48 48"
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <defs>
                <linearGradient
                    id={gradientId}
                    x1="14"
                    y1="14"
                    x2="44"
                    y2="44"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#2563EB" />
                    <stop offset="1" stopColor="#10B981" />
                </linearGradient>
            </defs>
            <g stroke="currentColor">
                <path d="M28 4.5H13.5a5 5 0 0 0-5 5v28a5 5 0 0 0 5 5H21" />
                <path d="M28 4.5 37.5 14v7.5" />
                <path d="M28 4.5V11a3 3 0 0 0 3 3h6.5" />
            </g>
            <g stroke={`url(#${gradientId})`}>
                <path d="M15.5 17h8M15.5 24h6M15.5 31h4" />
                <path d="M35 24l8.66 5v10L35 44l-8.66-5V29L35 24Z" />
                <path d="M26.34 29 35 34l8.66-5M35 34v10" />
            </g>
        </svg>
    )
}

interface LogoProps extends CommonProps {
    /** `full`: isotipo y nombre. `streamline`: solo isotipo */
    type?: 'full' | 'streamline'
    /** `dark`: para fondos oscuros (trazo y nombre en blanco) */
    mode?: 'light' | 'dark'
    /** Muestra «Inventario · Facturación» bajo el nombre */
    tagline?: boolean
    /** Alto del isotipo en píxeles */
    size?: number
}

const Logo = (props: LogoProps) => {
    const {
        type = 'full',
        mode = 'light',
        tagline = false,
        size = 32,
        className,
        style,
    } = props

    return (
        <div
            role="img"
            aria-label={APP_NAME}
            className={classNames(
                'logo inline-flex items-center gap-2.5 select-none',
                mode === 'dark' ? 'text-white' : 'text-gray-900',
                className
            )}
            style={style}
        >
            <LogoMark size={size} className="shrink-0" />
            {type === 'full' && (
                <span className="flex flex-col leading-none">
                    <span
                        className="font-bold tracking-tight"
                        style={{ fontSize: size * 0.72 }}
                    >
                        fac<span className="text-brand-gradient">lab</span>
                    </span>
                    {tagline && (
                        <span
                            className={classNames(
                                'mt-1.5 font-medium uppercase tracking-[0.18em]',
                                mode === 'dark'
                                    ? 'text-gray-400'
                                    : 'text-gray-500'
                            )}
                            style={{ fontSize: Math.max(size * 0.2, 9) }}
                        >
                            Inventario · Facturación
                        </span>
                    )}
                </span>
            )}
        </div>
    )
}

export default Logo
