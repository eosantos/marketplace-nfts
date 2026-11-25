import type { MockDb, MockSequences } from './types'

/** Incrementa e devolve a próxima sequência (tolera bancos persistidos sem o campo). */
export function nextSequence(db: MockDb, key: keyof MockSequences): number {
  const next = (db.sequences[key] ?? 0) + 1
  db.sequences[key] = next
  return next
}
