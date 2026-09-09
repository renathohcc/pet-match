import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore'
import { db } from './firebase'

function interestId(petId, userId) {
  return `${petId}_${userId}`
}

/** Manifesta interesse num pet — fica "pendente" até o doador aceitar ou recusar. */
export async function requestInterest({ petId, userId, message }) {
  await setDoc(doc(db, 'interests', interestId(petId, userId)), {
    petId,
    userId,
    status: 'pendente',
    message: message || '',
    createdAt: serverTimestamp(),
  })
}

/** O próprio interesse do usuário logado nesse pet (ou null, se nunca manifestou). */
export async function getMyInterest(petId, userId) {
  const snapshot = await getDoc(doc(db, 'interests', interestId(petId, userId)))
  return snapshot.exists() ? snapshot.data() : null
}

/**
 * Todos os pedidos de interesse de um pet (qualquer status), com nome/foto —
 * pro painel "Pedidos de interesse" do doador.
 */
export async function listInterests(petId) {
  const q = query(collection(db, 'interests'), where('petId', '==', petId))
  const snapshot = await getDocs(q)
  const interests = snapshot.docs.map((d) => d.data())

  return Promise.all(
    interests.map(async (interest) => {
      const userSnap = await getDoc(doc(db, 'users', interest.userId))
      const data = userSnap.exists() ? userSnap.data() : {}
      return { ...interest, displayName: data.displayName || 'Usuário', photoURL: data.photoURL || '' }
    })
  )
}

/**
 * Só quem já foi aceito — usado na hora de marcar o pet como "Adotado" (só
 * faz sentido escolher entre quem o doador já vetou/conversou).
 */
export async function listAcceptedInterestedUsers(petId) {
  const all = await listInterests(petId)
  return all.filter((i) => i.status === 'aceito').map((i) => ({
    uid: i.userId,
    displayName: i.displayName,
    photoURL: i.photoURL,
  }))
}

export async function updateInterestStatus(petId, userId, status) {
  await updateDoc(doc(db, 'interests', interestId(petId, userId)), { status })
}
