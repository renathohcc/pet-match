import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore'
import { db } from './firebase'

const petsRef = collection(db, 'pets')

/**
 * Busca pets disponíveis, com filtros opcionais (todos client-side por enquanto
 * — dá pra mover pra query() com where() quando o volume de dados justificar).
 */
export async function listAvailablePets(filters = {}) {
  const q = query(petsRef, where('status', '==', 'disponivel'))
  const snapshot = await getDocs(q)
  let pets = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))

  if (filters.species) {
    pets = pets.filter((p) => p.species === filters.species)
  }
  if (filters.size) {
    pets = pets.filter((p) => p.size === filters.size)
  }
  if (filters.sex) {
    pets = pets.filter((p) => p.sex === filters.sex)
  }

  return pets
}

export async function getPetById(id) {
  const snapshot = await getDoc(doc(db, 'pets', id))
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null
}
