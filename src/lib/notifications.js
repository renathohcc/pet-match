import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import { getReviewId } from './reviews'

/**
 * "Lembrete de avaliação pendente" — não é uma notificação genérica, é a
 * existência de um pedido de avaliação em aberto. Usa o mesmo esquema de id
 * das reviews (`${petId}_${direction}`) pra criar/apagar ser trivial: quando
 * a review correspondente é enviada, o lembrete some (ver `deleteReviewReminder`
 * chamado depois de `submitReview` em PetDetail.jsx).
 */
export async function createReviewReminder({ petId, petName, direction, userId }) {
  await setDoc(doc(db, 'notifications', getReviewId(petId, direction)), {
    userId,
    petId,
    petName,
    direction,
    createdAt: serverTimestamp(),
  })
}

export async function deleteReviewReminder(petId, direction) {
  await deleteDoc(doc(db, 'notifications', getReviewId(petId, direction)))
}
