import { collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc, where, writeBatch } from 'firebase/firestore'
import { db } from './firebase'
import { getPublicProfile } from './users'
import { getPetById } from './pets'

export const REVIEW_DIRECTIONS = {
  donor_to_adopter: 'donor_to_adopter',
  adopter_to_donor: 'adopter_to_donor',
}

export function getReviewId(petId, direction) {
  return `${petId}_${direction}`
}

export async function submitReview({ petId, fromUserId, toUserId, direction, rating, comment, survey }) {
  await setDoc(doc(db, 'reviews', getReviewId(petId, direction)), {
    petId,
    fromUserId,
    toUserId,
    direction,
    rating,
    comment: comment || '',
    survey: survey || {},
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

/**
 * Melhores avaliações públicas pra usar como depoimentos reais na Home:
 * nota alta, com comentário escrito, e sem recurso aberto contra elas.
 * Enriquece com nome/foto de quem avaliou e o pet mencionado.
 */
export async function listHomeTestimonials(max = 3) {
  const reviews = await listAllReviews()

  const candidates = reviews
    .filter(
      (r) =>
        r.direction === REVIEW_DIRECTIONS.adopter_to_donor &&
        r.rating >= 4 &&
        (r.comment || '').trim() &&
        r.underDispute !== true
    )
    .slice(0, max)

  return Promise.all(
    candidates.map(async (r) => {
      const [author, pet] = await Promise.all([
        getPublicProfile(r.fromUserId),
        getPetById(r.petId),
      ])
      return {
        id: r.id,
        quote: r.comment.trim(),
        name: author.displayName,
        photoURL: author.photoURL,
        role: pet?.city || (author.tutorType === 'ong' ? 'ONG / protetor(a)' : 'Tutor(a) independente'),
        petId: r.petId,
        petName: pet?.name || '',
      }
    })
  )
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
  const id = getReviewId(petId, direction)
  const batch = writeBatch(db)
  batch.set(doc(db, 'reviewDisputes', id), {
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
  // `underDispute` na review é o sinal público pra esconder o comentário —
  // reviewDisputes em si é privado agora (ver firestore.rules).
  batch.update(doc(db, 'reviews', id), { underDispute: true })
  await batch.commit()
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
  const id = getReviewId(petId, direction)
  const batch = writeBatch(db)
  batch.delete(doc(db, 'reviewDisputes', id))
  batch.update(doc(db, 'reviews', id), { underDispute: false })
  await batch.commit()
}

/** Recurso procede: avaliação é removida de vez, e o recurso junto (nada mais a resolver). */
export async function upholdDispute(petId, direction) {
  await Promise.all([
    deleteDoc(doc(db, 'reviews', getReviewId(petId, direction))),
    deleteDoc(doc(db, 'reviewDisputes', getReviewId(petId, direction))),
  ])
}
