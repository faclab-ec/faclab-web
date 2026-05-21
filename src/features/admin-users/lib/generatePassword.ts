const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#%'

const generatePassword = () =>
    Array.from(crypto.getRandomValues(new Uint8Array(12)))
        .map((b) => CHARS[b % CHARS.length])
        .join('')

export default generatePassword
