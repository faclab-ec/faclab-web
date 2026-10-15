import { describe, it, expect, afterEach } from 'vitest'
import {
    authChannel,
    AUTH_CHANNEL_NAME,
    type AuthMessage,
} from '../authChannel'

/** Otra pestaña: su propio BroadcastChannel con el mismo nombre. */
const otherTab = () => new BroadcastChannel(AUTH_CHANNEL_NAME)

const nextMessage = (channel: BroadcastChannel) =>
    new Promise<AuthMessage>((resolve) => {
        channel.onmessage = (event) => resolve(event.data)
    })

describe('authChannel', () => {
    const opened: BroadcastChannel[] = []

    afterEach(() => {
        opened.splice(0).forEach((channel) => channel.close())
        authChannel._reset()
    })

    it('tells the other tabs about new tokens and logouts', async () => {
        const tab = otherTab()
        opened.push(tab)

        const received = nextMessage(tab)
        authChannel.post({ type: 'tokens', accessToken: 'at', expiresIn: 900 })
        expect(await received).toEqual({
            type: 'tokens',
            accessToken: 'at',
            expiresIn: 900,
        })

        const logout = nextMessage(tab)
        authChannel.post({ type: 'logout' })
        expect(await logout).toEqual({ type: 'logout' })
    })

    it('delivers what other tabs post until unsubscribed', async () => {
        const tab = otherTab()
        opened.push(tab)
        const seen: AuthMessage[] = []
        const unsubscribe = authChannel.subscribe((m) => seen.push(m))

        tab.postMessage({ type: 'logout' })
        await expect.poll(() => seen).toEqual([{ type: 'logout' }])

        unsubscribe()
        tab.postMessage({ type: 'logout' })
        await new Promise((resolve) => setTimeout(resolve, 20))
        expect(seen).toHaveLength(1)
    })
})
