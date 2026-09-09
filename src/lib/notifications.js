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
    type: 'review_reminder',
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

/** Avisa o doador que alguém manifestou interesse no pet. */
export async function createInterestRequestNotification({ petId, petName, donorId, fromUserId, fromUserName }) {
  await setDoc(doc(db, 'notifications', `interest_${petId}_${fromUserId}`), {
    type: 'interest_request',
    userId: donorId,
    petId,
    petName,
    fromUserId,
    fromUserName,
    createdAt: serverTimestamp(),
  })
}

/** Some quando o doador aceita ou recusa o pedido (a "ação" resolve o pedido). */
export async function deleteInterestRequestNotification(petId, fromUserId) {
  await deleteDoc(doc(db, 'notifications', `interest_${petId}_${fromUserId}`))
}

/** Avisa quem teve o interesse aceito que já pode conversar. */
export async function createInterestAcceptedNotification({ petId, petName, userId }) {
  await setDoc(doc(db, 'notifications', `interest_accepted_${petId}_${userId}`), {
    type: 'interest_accepted',
    userId,
    petId,
    petName,
    createdAt: serverTimestamp(),
  })
}

/** Dispensa a notificação "interesse aceito" (ex: ao clicar nela). */
export async function deleteInterestAcceptedNotification(petId, userId) {
  await deleteDoc(doc(db, 'notifications', `interest_accepted_${petId}_${userId}`))
}

/** Avisa a pessoa escolhida que o doador quer que ela confirme a adoção. */
export async function createAdoptionConfirmRequestNotification({ petId, petName, userId }) {
  await setDoc(doc(db, 'notifications', `adoption_confirm_${petId}_${userId}`), {
    type: 'adoption_confirm_request',
    userId,
    petId,
    petName,
    createdAt: serverTimestamp(),
  })
}

/** Some quando a confirmação é resolvida (confirmada ou cancelada) — nunca ao só clicar. */
export async function deleteAdoptionConfirmRequestNotification(petId, userId) {
  await deleteDoc(doc(db, 'notifications', `adoption_confirm_${petId}_${userId}`))
}

/** Avisa o doador que a pessoa escolhida confirmou a adoção de verdade. */
export async function createAdoptionConfirmedNotification({ petId, petName, userId, fromUserId, fromUserName }) {
  await setDoc(doc(db, 'notifications', `adoption_confirmed_${petId}_${userId}`), {
    type: 'adoption_confirmed',
    userId,
    petId,
    petName,
    fromUserId,
    fromUserName,
    createdAt: serverTimestamp(),
  })
}

/** Dispensa a notificação "adoção confirmada" (ex: ao clicar nela). */
export async function deleteAdoptionConfirmedNotification(petId, userId) {
  await deleteDoc(doc(db, 'notifications', `adoption_confirmed_${petId}_${userId}`))
}
