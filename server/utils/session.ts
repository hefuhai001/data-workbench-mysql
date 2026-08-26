import type { Buffer } from 'node:buffer'

// 仅在 Nitro 进程内存中保存解锁后的 AES 密钥，不落盘
export const session: { masterKey: Buffer | null; unlocked: boolean } = {
  masterKey: null,
  unlocked: false
}

export function assertUnlocked(): Buffer {
  if (!session.unlocked || !session.masterKey) {
    const err = new Error('NOT_UNLOCKED') as Error & { statusCode: number }
    err.statusCode = 401
    throw err
  }
  return session.masterKey
}