import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore'
import { db } from './firebase'

/** Registra que `userId` clicou em "Conversar no WhatsApp" pra `petId`. */
export async function registerInterest(petId, userId) {
  await setDoc(
    doc(db, 'interests', `${petId}_${userId}`),
    { petId, userId, createdAt: serverTimestamp() },
    { merge: true }
  )
}

/**
 * Lista quem demonstrou interesse num pet, com nome/foto (pro doador
 * escolher quem foi o adotante ao marcar o pet como adotado).
 */
export async function listInterestedUsers(petId) {
  const q = query(collection(db, 'interests'), where('petId', '==', petId))
  const snapshot = await getDocs(q)
  const userIds = snapshot.docs.map((d) => d.data().userId)

  const profiles = await Promise.all(
    userIds.map(async (uid) => {
      const userSnap = await getDoc(doc(db, 'users', uid))
      const data = userSnap.exists() ? userSnap.data() : {}
      return { uid, displayName: data.displayName || 'Usuário', photoURL: data.photoURL || '' }
    })
  )

  return profiles
}
