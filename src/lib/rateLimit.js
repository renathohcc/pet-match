import { doc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

/**
 * Rate limiting sem backend: cada ação sensível (criar pet, denúncia,
 * interesse) grava um carimbo de tempo em rateLimits/{uid} DENTRO do mesmo
 * batch da ação. As regras exigem esse carimbo (getAfter) e impõem um
 * intervalo mínimo entre carimbos do mesmo tipo — ver firestore.rules.
 */
export function stampRateLimit(batch, uid, field) {
  batch.set(doc(db, 'rateLimits', uid), { [field]: serverTimestamp() }, { merge: true })
}

export const RATE_LIMIT_MESSAGE =
  'Você fez isso rápido demais. Espere alguns segundos e tente de novo.'

/** As regras de rate limit rejeitam com permission-denied — traduz pra msg amigável. */
export function isRateLimitError(err) {
  return err?.code === 'permission-denied'
}
