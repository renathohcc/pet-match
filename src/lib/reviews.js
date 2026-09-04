import { collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc, where } from 'firebase/firestore'
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

/** Todas as avaliações do site, mais recentes primeiro — usado no painel admin. */
export async function listAllReviews() {
  const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

/** Remove uma avaliação permanentemente (admin only, ver firestore.rules). */
export async function deleteReview(petId, direction) {
  await deleteDoc(doc(db, 'reviews', getReviewId(petId, direction)))
}

/**
 * Abre um recurso contra a avaliação recebida — só quem foi avaliado pode
 * contestar a própria (validado no firestore.rules). Guarda uma cópia dos
 * dados da avaliação junto pro admin não precisar de leitura extra.
 */
export async function disputeReview({ petId, direction, disputedBy, reason, review }) {
  await setDoc(doc(db, 'reviewDisputes', getReviewId(petId, direction)), {
    petId,
    direction,
    disputedBy,
    reason,
    fromUserId: review.fromUserId,
    toUserId: review.toUserId,
    rating: review.rating,
    comment: review.comment,
    createdAt: serverTimestamp(),
  })
}

/** Retorna o recurso aberto pra essa avaliação, ou null se não tem nenhum. */
export async function getReviewDispute(petId, direction) {
  const snapshot = await getDoc(doc(db, 'reviewDisputes', getReviewId(petId, direction)))
  return snapshot.exists() ? snapshot.data() : null
}

/** Todos os recursos em aberto — usado no painel admin (um recurso resolvido é excluído, não fica "pendente"/"resolvido"). */
export async function listAllDisputes() {
  const q = query(collection(db, 'reviewDisputes'), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

/** Recurso indevido: comentário volta a aparecer publicamente. */
export async function rejectDispute(petId, direction) {
  await deleteDoc(doc(db, 'reviewDisputes', getReviewId(petId, direction)))
}

/** Recurso procede: avaliação é removida de vez, e o recurso junto (nada mais a resolver). */
export async function upholdDispute(petId, direction) {
  await Promise.all([
    deleteDoc(doc(db, 'reviews', getReviewId(petId, direction))),
    deleteDoc(doc(db, 'reviewDisputes', getReviewId(petId, direction))),
  ])
}
