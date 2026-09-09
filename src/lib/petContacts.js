import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './firebase'

/**
 * Contato (whatsapp) do doador de um pet — fora do doc público de `pets`
 * de propósito (ver firestore.rules: só o doador e quem tem interesse
 * aceito conseguem ler).
 */
export async function getPetContact(petId) {
  const snapshot = await getDoc(doc(db, 'petContacts', petId))
  return snapshot.exists() ? snapshot.data() : null
}

export async function setPetContact(petId, { whatsapp, donorId }) {
  await setDoc(doc(db, 'petContacts', petId), { whatsapp, donorId })
}
