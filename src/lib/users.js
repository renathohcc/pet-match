import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore'
import { db } from './firebase'

export const TUTOR_TYPES = {
  independente: 'Tutor(a) independente',
  ong: 'ONG / protetor(a)',
}

export async function updateUserProfile(uid, profile) {
  await setDoc(doc(db, 'users', uid), profile, { merge: true })
}

/** Perfil público de outro usuário (nome/foto/tipo de tutor) — ex: pra exibir quem é o adotante. */
export async function getPublicProfile(uid) {
  const snapshot = await getDoc(doc(db, 'users', uid))
  if (!snapshot.exists()) return { displayName: 'Usuário', photoURL: '', tutorType: 'independente' }
  const data = snapshot.data()
  return {
    displayName: data.displayName || 'Usuário',
    photoURL: data.photoURL || '',
    tutorType: data.tutorType || 'independente',
  }
}

/** Todos os usuários com perfil no Firestore — usado no painel admin. */
export async function listAllUsers() {
  const snapshot = await getDocs(collection(db, 'users'))
  return snapshot.docs.map((d) => ({ uid: d.id, ...d.data() }))
}
