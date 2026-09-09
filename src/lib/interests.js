import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore'
import { db } from './firebase'

function interestId(petId, userId) {
  return `${petId}_${userId}`
}

/** Manifesta interesse num pet — fica "pendente" até o doador aceitar ou recusar. */
export async function requestInterest({ petId, petName, donorId, userId, message }) {
  await setDoc(doc(db, 'interests', interestId(petId, userId)), {
    petId,
    petName,
    donorId,
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

async function enrichWithProfile(interest) {
  const userSnap = await getDoc(doc(db, 'users', interest.userId))
  const data = userSnap.exists() ? userSnap.data() : {}
  return { ...interest, displayName: data.displayName || 'Usuário', photoURL: data.photoURL || '' }
}

/**
 * Todos os pedidos de interesse de UM pet (qualquer status), com nome/foto —
 * pro teaser de `PetDetail.jsx`. Precisa de `donorId` (não só `petId`): a
 * regra do Firestore só libera uma QUERY de lista quando ela consegue provar
 * a permissão comparando o mesmo campo do `where()` — `donorId` tem essa
 * comparação direta na regra, `petId` sozinho não tem (ver `listReceivedInterests`
 * abaixo, que já faz essa query; aqui só filtra pro pet específico depois).
 */
export async function listInterests(petId, donorId) {
  const all = await listReceivedInterests(donorId)
  return all.filter((i) => i.petId === petId)
}

/**
 * Todos os pedidos recebidos pelo usuário, em qualquer um dos pets dele —
 * pra página /pedidos ("Pedidos que recebi").
 */
export async function listReceivedInterests(donorId) {
  const q = query(collection(db, 'interests'), where('donorId', '==', donorId))
  const snapshot = await getDocs(q)
  return Promise.all(snapshot.docs.map((d) => enrichWithProfile(d.data())))
}

/**
 * Todos os pedidos que o usuário fez, em qualquer pet — pra página /pedidos
 * ("Meus pedidos").
 */
export async function listMyInterests(userId) {
  const q = query(collection(db, 'interests'), where('userId', '==', userId))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => d.data())
}

export async function updateInterestStatus(petId, userId, status) {
  await updateDoc(doc(db, 'interests', interestId(petId, userId)), { status })
}
