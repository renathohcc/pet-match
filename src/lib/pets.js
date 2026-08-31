import { collection, deleteDoc, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore'
import { db } from './firebase'

export const PET_STATUSES = {
  disponivel: 'Disponível',
  em_processo: 'Em processo',
  adotado: 'Adotado',
}

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
  if (filters.city) {
    pets = pets.filter((p) => p.city === filters.city)
  }
  if (filters.neighborhood) {
    pets = pets.filter((p) => p.neighborhood === filters.neighborhood)
  }

  return pets
}

/**
 * Todos os pets cadastrados por um usuário, independente do status
 * (a rule de leitura já permite isso pro dono via isOwner()).
 */
export async function listMyPets(uid) {
  const q = query(petsRef, where('donorId', '==', uid))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function getPetById(id) {
  const snapshot = await getDoc(doc(db, 'pets', id))
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null
}

export async function updatePetStatus(id, status) {
  await updateDoc(doc(db, 'pets', id), { status })
}

export async function deletePet(id) {
  await deleteDoc(doc(db, 'pets', id))
}
