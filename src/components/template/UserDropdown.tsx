import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
    HiChevronDown,
    HiOutlineKey,
    HiOutlineLogout,
    HiOutlineSwitchHorizontal,
} from 'react-icons/hi'
import Avatar from '@/components/ui/Avatar'
import Dropdown from '@/components/ui/Dropdown'
import useAuth from '@/utils/hooks/useAuth'
import { ROLE_LABELS } from '@/constants/roles.constant'
import { useSession } from '@/stores'
import { TenantSwitchDialog, tenantDisplayName } from '@features/auth'

const initialsOf = (username: string) => username.slice(0, 2).toUpperCase()

/** Quién tiene la sesión abierta, en qué empresa, y las acciones sobre su cuenta. */
const UserDropdown = () => {
    const { signOut } = useAuth()
    const session = useSession()
    const [switchingTenant, setSwitchingTenant] = useState(false)

    if (!session) {
        return null
    }

    const roleLabel = ROLE_LABELS[session.role]
    const displayName = session.fullName || session.username

    const trigger = (
        <div className="flex items-center gap-2.5 rounded-lg py-1 pl-1 pr-2 transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-gray-800">
            <Avatar size={34} shape="circle" className="font-semibold">
                {initialsOf(session.username)}
            </Avatar>
            <div className="hidden text-left leading-tight md:block">
                <div className="font-semibold text-gray-900 dark:text-gray-50">
                    {displayName}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                    {roleLabel}
                </div>
            </div>
            <HiChevronDown className="hidden text-gray-400 md:block" />
        </div>
    )

    return (
        <>
            <Dropdown
                aria-label="Menú de usuario"
                menuStyle={{ minWidth: 240 }}
                renderTitle={trigger}
                placement="bottom-end"
            >
                <Dropdown.Item variant="header">
                    <div className="flex items-center gap-3 px-3 py-2">
                        <Avatar shape="circle" className="font-semibold">
                            {initialsOf(session.username)}
                        </Avatar>
                        <div className="min-w-0">
                            <div className="truncate font-semibold text-gray-900 dark:text-gray-50">
                                {displayName}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                {roleLabel}
                            </div>
                            <div
                                className="truncate text-xs text-gray-500 dark:text-gray-400"
                                title={session.tenant.legalName}
                            >
                                {tenantDisplayName(session.tenant)}
                            </div>
                        </div>
                    </div>
                </Dropdown.Item>
                <Dropdown.Item variant="divider" />
                {session.tenants.length > 1 && (
                    <Dropdown.Item
                        eventKey="switchTenant"
                        className="gap-2"
                        onClick={() => setSwitchingTenant(true)}
                    >
                        <HiOutlineSwitchHorizontal className="text-lg text-gray-400" />
                        <span>Cambiar empresa</span>
                    </Dropdown.Item>
                )}
                <Dropdown.Item eventKey="changePassword" className="px-0">
                    <Link
                        className="flex h-full w-full items-center gap-2 px-3"
                        to="/change-password"
                    >
                        <HiOutlineKey className="text-lg text-gray-400" />
                        <span>Cambiar contraseña</span>
                    </Link>
                </Dropdown.Item>
                <Dropdown.Item
                    eventKey="signOut"
                    className="gap-2"
                    onClick={signOut}
                >
                    <HiOutlineLogout className="text-lg text-gray-400" />
                    <span>Cerrar sesión</span>
                </Dropdown.Item>
            </Dropdown>
            <TenantSwitchDialog
                isOpen={switchingTenant}
                onClose={() => setSwitchingTenant(false)}
            />
        </>
    )
}

export default UserDropdown
