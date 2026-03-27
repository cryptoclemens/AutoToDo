import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGO = 'aes-256-gcm'

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET
  if (!secret || secret.length !== 64) {
    throw new Error('ENCRYPTION_SECRET must be a 64-character hex string (32 bytes)')
  }
  return Buffer.from(secret, 'hex')
}

export function encrypt(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGO, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return JSON.stringify({
    iv: iv.toString('hex'),
    data: encrypted.toString('hex'),
    tag: tag.toString('hex'),
  })
}

export function decrypt(payload: string): string {
  const key = getKey()
  let parsed: { iv: string; data: string; tag: string }
  try {
    parsed = JSON.parse(payload)
  } catch {
    throw new Error('Ungültiges verschlüsseltes Datenformat.')
  }
  if (!parsed.iv || !parsed.data || !parsed.tag) {
    throw new Error('Fehlende Verschlüsselungsfelder.')
  }
  try {
    const decipher = createDecipheriv(ALGO, key, Buffer.from(parsed.iv, 'hex'))
    decipher.setAuthTag(Buffer.from(parsed.tag, 'hex'))
    return decipher.update(Buffer.from(parsed.data, 'hex'), undefined, 'utf8') + decipher.final('utf8')
  } catch {
    throw new Error('Entschlüsselung fehlgeschlagen. Daten beschädigt oder falscher Schlüssel.')
  }
}
