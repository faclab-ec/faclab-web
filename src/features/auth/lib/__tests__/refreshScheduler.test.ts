import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { refreshScheduler } from '../refreshScheduler'
import { refreshSession } from '@shared/lib/auth/session'
import { useAuthStore } from '@/stores/useAuthStore'

// vi.mock calls are hoisted by Vitest before imports at runtime
vi.mock('@shared/lib/auth/session', () => ({
    refreshSession: vi.fn(),
}))

vi.mock('@/stores/useAuthStore', () => ({
    useAuthStore: {
        getState: vi.fn(),
    },
}))

const mockRefreshSession = vi.mocked(refreshSession)
const mockGetState = vi.mocked(useAuthStore.getState)

describe('refreshScheduler', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        mockGetState.mockReturnValue({
            refreshToken: 'mock-rt',
            setTokens: vi.fn(),
            accessToken: null,
            clear: vi.fn(),
            setSession: vi.fn(),
        } as never)
    })

    afterEach(() => {
        refreshScheduler.stop()
        vi.useRealTimers()
        vi.clearAllMocks()
    })

    it('is not running initially', () => {
        expect(refreshScheduler._isRunning()).toBe(false)
    })

    it('start() schedules a timer', () => {
        refreshScheduler.start(120)
        expect(refreshScheduler._isRunning()).toBe(true)
    })

    it('timer does not fire before the delay', () => {
        refreshScheduler.start(120) // delay = (120-60)*1000 = 60000ms
        vi.advanceTimersByTime(59_000)
        expect(refreshScheduler._isRunning()).toBe(true)
    })

    it('stop() cancels the scheduled timer', () => {
        refreshScheduler.start(300)
        expect(refreshScheduler._isRunning()).toBe(true)
        refreshScheduler.stop()
        expect(refreshScheduler._isRunning()).toBe(false)
    })

    it('start() replaces an existing timer without duplicating', () => {
        refreshScheduler.start(300)
        refreshScheduler.start(600)
        refreshScheduler.stop()
        expect(refreshScheduler._isRunning()).toBe(false)
    })

    it('calls refreshSession when timer fires and re-schedules on success', async () => {
        const newTokens = {
            accessToken: 'new-at',
            refreshToken: 'new-rt',
            expiresIn: 300,
            tokenType: 'Bearer' as const,
        }
        mockRefreshSession.mockResolvedValueOnce(newTokens)

        refreshScheduler.start(61) // delay = (61-60)*1000 = 1000ms
        vi.advanceTimersByTime(1000) // fires the 1s timer
        // Flush microtasks only — do not advance macrotimers so the re-scheduled
        // 240s timer is not triggered before we can assert it exists
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()

        expect(mockRefreshSession).toHaveBeenCalledTimes(1)
        expect(refreshScheduler._isRunning()).toBe(true) // re-scheduled for 240s
    })

    it('does not throw and does not re-schedule if refreshSession fails', async () => {
        mockRefreshSession.mockRejectedValueOnce(new Error('network error'))

        refreshScheduler.start(61)
        vi.advanceTimersByTime(1000)
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()

        expect(refreshScheduler._isRunning()).toBe(false)
    })

    it('does nothing if refreshToken is absent', async () => {
        mockGetState.mockReturnValue({
            refreshToken: null,
            setTokens: vi.fn(),
            accessToken: null,
            clear: vi.fn(),
            setSession: vi.fn(),
        } as never)

        refreshScheduler.start(61)
        vi.advanceTimersByTime(1000)
        await Promise.resolve()
        await Promise.resolve()

        expect(mockRefreshSession).not.toHaveBeenCalled()
    })

    it('clamps negative delay to 0 (expiresIn < 60)', () => {
        // (30-60)*1000 = -30000 → Math.max(0, ...) = 0 → fires immediately
        refreshScheduler.start(30)
        expect(refreshScheduler._isRunning()).toBe(true)
    })
})
