import { doc, setDoc } from 'firebase/firestore'
import { db } from './firebase'

export const TUTOR_TYPES = {
  independente: 'Tutor(a) independente',
  ong: 'ONG / protetor(a)',
}

export async function updateUserProfile(uid, profile) {
  await setDoc(doc(db, 'users', uid), profile, { merge: true })
}
