import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '../useAuthStore'

const tokensInStorage = () =>
    [localStorage, sessionStorage].flatMap((storage) =>
        Object.keys(storage).filter((key) =>
            /access|refresh|token/i.test(`${key}=${storage.getItem(key)}`)
        )
    )

describe('useAuthStore', () => {
    beforeEach(() => {
        localStorage.clear()
        sessionStorage.clear()
        useAuthStore.getState().clear()
    })

    it('keeps the access token in memory, never in browser storage', () => {
        useAuthStore
            .getState()
            .setTokens({ accessToken: 'secret-access-token', expiresIn: 900 })

        expect(useAuthStore.getState().accessToken).toBe('secret-access-token')
        expect(tokensInStorage()).toEqual([])
        for (const storage of [localStorage, sessionStorage]) {
            for (const key of Object.keys(storage)) {
                expect(storage.getItem(key)).not.toContain(
                    'secret-access-token'
                )
            }
        }
    })

    it('only remembers that a session exists, and forgets it on clear', () => {
        useAuthStore
            .getState()
            .setTokens({ accessToken: 'secret-access-token', expiresIn: 900 })
        expect(localStorage.getItem('fc.hasSession')).toBe('1')

        useAuthStore.getState().clear()

        expect(useAuthStore.getState().accessToken).toBeNull()
        expect(localStorage.getItem('fc.hasSession')).toBeNull()
    })
})
