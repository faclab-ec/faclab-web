const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#%'
// The largest multiple of CHARS.length a byte can hold: bytes above it are drawn again, so every
// character is equally likely (b % 58 alone favours the first 24)
const LIMIT = 256 - (256 % CHARS.length)

const generatePassword = (length = 12) => {
    const chars: string[] = []
    while (chars.length < length) {
        for (const b of crypto.getRandomValues(new Uint8Array(length))) {
            if (b < LIMIT && chars.length < length) chars.push(CHARS[b % CHARS.length])
        }
    }
    return chars.join('')
}

export default generatePassword
