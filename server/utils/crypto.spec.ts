import { test } from 'node:test'
import assert from 'node:assert'
import {
  hashPassword, verifyPassword,
  createKey, encryptSecret, decryptSecret
} from './crypto.ts'

test('hash/verify 密码', () => {
  const { hash, salt } = hashPassword('hunter2')
  assert.ok(verifyPassword('hunter2', hash, salt))
  assert.ok(!verifyPassword('wrong', hash, salt))
})

test('双向加解密', () => {
  const key = createKey('masterPass', Buffer.alloc(16, 1).toString('hex'))
  const enc = encryptSecret('mysqlPass123', key)
  assert.notEqual(enc.ciphertext, 'mysqlPass123')
  assert.equal(decryptSecret(enc, key), 'mysqlPass123')
})