import { describe, it, expect, beforeEach } from 'vitest'
import { ROLE } from '@/constants/roles.constant'
import type { BranchSummary, Session } from '@/@types/auth'
import { useAuthStore } from '../useAuthStore'
import {
    activeBranch,
    currentPlacement,
    useWorkplaceStore,
} from '../useWorkplaceStore'

const MAIN: BranchSummary = {
    id: 1,
    establishmentCode: '001',
    name: 'Matriz',
    isMain: true,
}
const NORTH: BranchSummary = {
    id: 2,
    establishmentCode: '002',
    name: 'Norte',
    isMain: false,
}

const session = (
    branches: BranchSummary[],
    tenantId = 'tenant-a'
): Session => ({
    id: 1,
    username: 'ana',
    fullName: null,
    role: ROLE.CASHIER,
    permissions: [],
    mustChangePassword: false,
    tenant: {
        id: tenantId,
        ruc: '0190000000001',
        legalName: 'A',
        tradeName: null,
    },
    tenants: [],
    branches,
})

const signIn = (s: Session) =>
    useAuthStore.getState().signIn({ accessToken: 'at', expiresIn: 900 }, s)

beforeEach(() => {
    localStorage.clear()
    useAuthStore.getState().clear()
    useWorkplaceStore.setState({ branchByTenant: {}, terminalByBranch: {} })
})

describe('activeBranch', () => {
    it('defaults to the main branch', () => {
        expect(activeBranch(session([NORTH, MAIN]), {})).toEqual(MAIN)
    })

    it('uses the chosen branch while the user may still enter it', () => {
        expect(activeBranch(session([MAIN, NORTH]), { 'tenant-a': 2 })).toEqual(
            NORTH
        )
    })

    it('ignores a chosen branch the user can no longer enter', () => {
        // Sin acceso a la matriz: la primera que tenga
        expect(activeBranch(session([NORTH]), { 'tenant-a': 1 })).toEqual(NORTH)
    })

    it('remembers the branch per company', () => {
        expect(
            activeBranch(session([MAIN, NORTH], 'tenant-b'), { 'tenant-a': 2 })
        ).toEqual(MAIN)
    })

    it('is null without a session or without branches', () => {
        expect(activeBranch(null, {})).toBeNull()
        expect(activeBranch(session([]), {})).toBeNull()
    })
})

describe('currentPlacement', () => {
    it('is empty without a session', () => {
        expect(currentPlacement()).toEqual({ branchId: null, terminalId: null })
    })

    it('gives the active branch and the terminal bound to it', () => {
        signIn(session([MAIN, NORTH]))
        const workplace = useWorkplaceStore.getState()
        workplace.bindTerminal('tenant-a', 1, 10)
        workplace.bindTerminal('tenant-a', 2, 20)

        expect(currentPlacement()).toEqual({ branchId: 1, terminalId: 10 })

        workplace.selectBranch('tenant-a', 2)
        expect(currentPlacement()).toEqual({ branchId: 2, terminalId: 20 })

        useWorkplaceStore.getState().unbindTerminal('tenant-a', 2)
        expect(currentPlacement()).toEqual({ branchId: 2, terminalId: null })
    })
})

describe('persistence', () => {
    it('remembers branch and terminal in this browser, nothing secret', () => {
        signIn(session([MAIN, NORTH]))
        useWorkplaceStore.getState().selectBranch('tenant-a', 2)
        useWorkplaceStore.getState().bindTerminal('tenant-a', 2, 20)

        const stored = JSON.parse(localStorage.getItem('fc.workplace') ?? '{}')
        expect(stored.state).toEqual({
            branchByTenant: { 'tenant-a': 2 },
            terminalByBranch: { 'tenant-a:2': 20 },
        })
        expect(Object.keys(localStorage).join()).not.toMatch(/token/i)
    })

    it('survives signing out: the terminal stays bound to the computer', () => {
        signIn(session([MAIN]))
        useWorkplaceStore.getState().bindTerminal('tenant-a', 1, 10)

        useAuthStore.getState().clear()

        expect(useWorkplaceStore.getState().terminalByBranch).toEqual({
            'tenant-a:1': 10,
        })
    })
})
