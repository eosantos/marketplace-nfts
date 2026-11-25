// Hash/verificação de senha usado pelo mock de autenticação e pelos testes.
// Web Crypto PBKDF2-SHA256; a senha em claro nunca é persistida no banco.

export const PASSWORD_HASH_ALGORITHM = 'PBKDF2-SHA256' as const
export const PASSWORD_HASH_ITERATIONS = 120_000

export interface PasswordCredentials {
  passwordHash: string
  passwordSalt: string
  passwordIterations: number
}

const encoder = new TextEncoder()

function getSubtle(): SubtleCrypto {
  const subtle = globalThis.crypto?.subtle
  if (!subtle) {
    throw new Error('Web Crypto indisponível: não é possível derivar a senha')
  }
  return subtle
}

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  if (hex.length % 2 !== 0 || !/^[a-fA-F0-9]*$/.test(hex)) {
    throw new Error('Salt inválido: esperado hexadecimal de tamanho par')
  }

  const bytes = new Uint8Array(new ArrayBuffer(hex.length / 2))
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16)
  }
  return bytes
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function constantTimeEqualHex(left: string, right: string): boolean {
  if (left.length !== right.length) return false

  let diff = 0
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }
  return diff === 0
}

/** Deriva o hash PBKDF2-SHA256 da senha com o salt/iterações informados. */
export async function hashPassword(
  password: string,
  saltHex: string,
  iterations: number = PASSWORD_HASH_ITERATIONS,
): Promise<string> {
  const key = await getSubtle().importKey('raw', encoder.encode(password), 'PBKDF2', false, [
    'deriveBits',
  ])
  const bits = await getSubtle().deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: hexToBytes(saltHex),
      iterations,
    },
    key,
    256,
  )

  return bytesToHex(new Uint8Array(bits))
}

/** Compara a senha em claro com as credenciais armazenadas (hash + salt + iterações). */
export async function verifyPassword(
  password: string,
  credentials: PasswordCredentials,
): Promise<boolean> {
  const derived = await hashPassword(
    password,
    credentials.passwordSalt,
    credentials.passwordIterations,
  )
  return constantTimeEqualHex(derived, credentials.passwordHash)
}
