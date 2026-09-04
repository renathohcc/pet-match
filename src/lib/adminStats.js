import { collection, getCountFromServer, query, where } from 'firebase/firestore'
import { db } from './firebase'

async function countOf(collectionName, ...whereClauses) {
  const base = collection(db, collectionName)
  const q = whereClauses.length ? query(base, ...whereClauses) : base
  const snapshot = await getCountFromServer(q)
  return snapshot.data().count
}

/** Métricas gerais do site pro painel admin — só contagens (getCountFromServer), sem baixar documentos. */
export async function getSiteStats() {
  const [totalPets, disponivel, emProcesso, adotado, totalUsers, totalReviews, pendingDisputes] = await Promise.all([
    countOf('pets'),
    countOf('pets', where('status', '==', 'disponivel')),
    countOf('pets', where('status', '==', 'em_processo')),
    countOf('pets', where('status', '==', 'adotado')),
    countOf('users'),
    countOf('reviews'),
    countOf('reviewDisputes'),
  ])

  return {
    totalPets,
    petsByStatus: { disponivel, em_processo: emProcesso, adotado },
    totalUsers,
    totalReviews,
    pendingDisputes,
  }
}
