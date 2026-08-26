import { randomBytes, createCipheriv, createDecipheriv, pbkdf2Sync, timingSafeEqual } from 'node:crypto'

const PBKDF2_ITERATIONS = 100_000
const KEY_LEN = 32
const SALT_LEN = 16
const IV_LEN = 12
const DIGEST = 'sha256'

export function randomHex(len = 32): string {
  return randomBytes(len).toString('hex')
}

// —— 主密码哈希校验（随机盐 + PBKDF2）——
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = randomHex(SALT_LEN)
  const hash = pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LEN, DIGEST).toString('hex')
  return { hash, salt }
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const candidate = pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LEN, DIGEST)
  const expected = Buffer.from(hash, 'hex')
  return candidate.length === expected.length && timingSafeEqual(candidate, expected)
}

// —— 由主密码派生 AES 密钥 ——
export function createKey(masterPassword: string, masterSalt: string): Buffer {
  return pbkdf2Sync(masterPassword, masterSalt, PBKDF2_ITERATIONS, KEY_LEN, DIGEST)
}

export interface Encrypted { ciphertext: string; iv: string }

// —— AES-256-GCM 对称加解密（密文 = 明文+认证标签拼接后 base64）——
export function encryptSecret(plain: string, key: Buffer): Encrypted {
  const iv = randomBytes(IV_LEN)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return { ciphertext: Buffer.concat([enc, authTag]).toString('base64'), iv: iv.toString('base64') }
}

export function decryptSecret(enc: Encrypted, key: Buffer): string {
  const full = Buffer.from(enc.ciphertext, 'base64')
  const data = full.subarray(0, full.length - 16)
  const authTag = full.subarray(full.length - 16)
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(enc.iv, 'base64'))
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
}