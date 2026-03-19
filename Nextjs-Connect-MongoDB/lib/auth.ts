import { randomBytes, randomInt, scrypt as scryptCallback, timingSafeEqual } from 'crypto'
import { promisify } from 'util'

const scrypt = promisify(scryptCallback)
const KEY_LENGTH = 64

export async function hashSecret(value: string) {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = (await scrypt(value, salt, KEY_LENGTH)) as Buffer

  return `${salt}:${derivedKey.toString('hex')}`
}

export async function verifySecret(value: string, storedHash: string) {
  const [salt, key] = storedHash.split(':')

  if (!salt || !key) {
    return false
  }

  const derivedKey = (await scrypt(value, salt, KEY_LENGTH)) as Buffer
  const keyBuffer = Buffer.from(key, 'hex')

  if (keyBuffer.length !== derivedKey.length) {
    return false
  }

  return timingSafeEqual(keyBuffer, derivedKey)
}

export function generateVerificationCode() {
  return randomInt(100000, 1000000).toString()
}
