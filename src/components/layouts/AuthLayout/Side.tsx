import {
    HiOutlineChartBar,
    HiOutlineCube,
    HiOutlineDocumentText,
    HiOutlineOfficeBuilding,
} from 'react-icons/hi'
import Logo from '@/components/template/Logo'
import { APP_NAME } from '@/constants/app.constant'
import type { CommonProps } from '@/@types/common'
import type { ReactNode } from 'react'

const HIGHLIGHTS: { icon: ReactNode; title: string; description: string }[] = [
    {
        icon: <HiOutlineCube />,
        title: 'Control de inventario',
        description: 'Stock en tiempo real, sin complicaciones.',
    },
    {
        icon: <HiOutlineDocumentText />,
        title: 'Facturación electrónica',
        description: 'Cumple con el SRI de forma fácil.',
    },
    {
        icon: <HiOutlineChartBar />,
        title: 'Reportes y análisis',
        description: 'Decisiones basadas en datos reales.',
    },
    {
        icon: <HiOutlineOfficeBuilding />,
        title: 'Multi-sucursal',
        description: 'Gestiona varios locales desde un solo lugar.',
    },
]

/**
 * Pantallas sin sesión: panel de marca a la izquierda (solo en escritorio) y
 * el formulario a la derecha. En móvil la marca pasa a una franja superior.
 */
const Side = ({ children }: CommonProps) => {
    return (
        <div className="grid flex-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <aside className="relative hidden flex-col justify-between overflow-hidden bg-gray-900 px-12 py-10 text-white lg:flex xl:px-16">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-primary-600/25 blur-3xl"
                />
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-accent-500/15 blur-3xl"
                />

                <Logo tagline mode="dark" size={44} className="relative" />

                <div className="relative">
                    <p className="text-3xl font-semibold leading-tight tracking-tight xl:text-4xl">
                        Tu negocio en orden,
                        <br />
                        <span className="text-brand-gradient">siempre.</span>
                    </p>
                    <ul className="mt-10 grid gap-6 xl:grid-cols-2">
                        {HIGHLIGHTS.map((item) => (
                            <li key={item.title} className="flex gap-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl text-primary-300">
                                    {item.icon}
                                </span>
                                <span>
                                    <span className="block font-semibold">
                                        {item.title}
                                    </span>
                                    <span className="block text-gray-400">
                                        {item.description}
                                    </span>
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                <p className="relative text-gray-400">
                    Simple. Potente. Para tu negocio.
                </p>
            </aside>

            <div className="flex flex-col bg-white dark:bg-gray-900">
                <div className="flex justify-center bg-gray-900 px-6 py-6 lg:hidden">
                    <Logo tagline mode="dark" size={36} />
                </div>
                <div className="flex flex-1 items-center justify-center px-6 py-10">
                    <div className="w-full max-w-sm">{children}</div>
                </div>
                <p className="px-6 pb-6 text-center text-xs text-gray-500">
                    &copy; {new Date().getFullYear()} {APP_NAME}
                </p>
            </div>
        </div>
    )
}

export default Side
