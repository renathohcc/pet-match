import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore'
import { db } from './firebase'

export const REVIEW_DIRECTIONS = {
  donor_to_adopter: 'donor_to_adopter',
  adopter_to_donor: 'adopter_to_donor',
}

export function getReviewId(petId, direction) {
  return `${petId}_${direction}`
}

export async function submitReview({ petId, fromUserId, toUserId, direction, rating, comment }) {
  await setDoc(doc(db, 'reviews', getReviewId(petId, direction)), {
    petId,
    fromUserId,
    toUserId,
    direction,
    rating,
    comment: comment || '',
    createdAt: serverTimestamp(),
  })
}

/** Retorna a avaliação já feita nesse sentido pra esse pet, ou null se ainda não existe. */
export async function getReview(petId, direction) {
  const snapshot = await getDoc(doc(db, 'reviews', getReviewId(petId, direction)))
  return snapshot.exists() ? snapshot.data() : null
}

/** Média + lista de avaliações recebidas por um usuário (como doador ou adotante). */
export async function getUserRatingSummary(uid) {
  const q = query(collection(db, 'reviews'), where('toUserId', '==', uid))
  const snapshot = await getDocs(q)
  const reviews = snapshot.docs.map((d) => d.data())

  if (reviews.length === 0) return { average: 0, count: 0, reviews: [] }

  const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
  return { average, count: reviews.length, reviews }
}

/** Abre um recurso contra a avaliação recebida — só quem foi avaliado pode contestar a própria. */
export async function disputeReview(petId, direction, disputedBy, reason) {
  await setDoc(doc(db, 'reviewDisputes', getReviewId(petId, direction)), {
    disputedBy,
    reason,
    createdAt: serverTimestamp(),
  })
}

/** Retorna o recurso aberto pra essa avaliação, ou null se não tem nenhum. */
export async function getReviewDispute(petId, direction) {
  const snapshot = await getDoc(doc(db, 'reviewDisputes', getReviewId(petId, direction)))
  return snapshot.exists() ? snapshot.data() : null
}
