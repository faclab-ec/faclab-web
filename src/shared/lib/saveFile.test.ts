import { afterEach, describe, expect, it, vi } from 'vitest'
import { saveFile } from './saveFile'

describe('saveFile', () => {
    afterEach(() => {
        vi.restoreAllMocks()
        vi.useRealTimers()
    })

    it('descarga el archivo con su nombre y libera la URL después', () => {
        vi.useFakeTimers()
        const createObjectURL = vi.fn(() => 'blob:ride')
        const revokeObjectURL = vi.fn()
        Object.assign(URL, { createObjectURL, revokeObjectURL })
        const clicks: { href: string; download: string }[] = []
        vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
            function (this: HTMLAnchorElement) {
                clicks.push({ href: this.href, download: this.download })
            }
        )

        saveFile(new Blob(['%PDF']), '0910.pdf')

        expect(clicks).toEqual([{ href: 'blob:ride', download: '0910.pdf' }])
        expect(document.querySelector('a[download]')).toBeNull()
        expect(revokeObjectURL).not.toHaveBeenCalled()
        vi.runAllTimers()
        expect(revokeObjectURL).toHaveBeenCalledWith('blob:ride')
    })
})
