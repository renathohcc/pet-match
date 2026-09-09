import { collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where, writeBatch } from 'firebase/firestore'
import { db } from './firebase'
import { stampRateLimit } from './rateLimit'

export const PET_STATUSES = {
  disponivel: 'Disponível',
  adotado: 'Adotado',
}

// Pós-moderação: a partir de N denúncias distintas, o anúncio some da busca
// e vai pra fila do admin (o link direto continua abrindo). Ver reportCount
// em src/lib/reports.js e a regra de update de `pets` no firestore.rules.
export const REPORT_HIDE_THRESHOLD = 3

const petsRef = collection(db, 'pets')

/**
 * Cria o anúncio + carimba o rate limit no mesmo batch (a regra de create
 * exige isso — ver firestore.rules). `createdAt` é preenchido aqui pra bater
 * com `request.time`.
 */
export async function createPet(petId, data, uid) {
  const batch = writeBatch(db)
  stampRateLimit(batch, uid, 'petAt')
  batch.set(doc(db, 'pets', petId), { ...data, createdAt: serverTimestamp() })
  await batch.commit()
}

/** Admin restaura um anúncio revisado (zera o contador de denúncias). */
export async function restorePetVisibility(petId) {
  await updateDoc(doc(db, 'pets', petId), { reportCount: 0 })
}

/**
 * Busca pets disponíveis, com filtros opcionais (todos client-side por enquanto
 * — dá pra mover pra query() com where() quando o volume de dados justificar).
 */
export async function listAvailablePets(filters = {}) {
  const q = query(petsRef, where('status', '==', 'disponivel'))
  const snapshot = await getDocs(q)
  let pets = snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    // Pós-moderação: esconde da busca quem acumulou denúncias demais.
    .filter((p) => (p.reportCount || 0) < REPORT_HIDE_THRESHOLD)

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

/**
 * Busca vários pets pelo id (ex: lista de favoritos). Ids que não existem
 * mais (pet excluído) são simplesmente omitidos do resultado.
 */
export async function getPetsByIds(ids) {
  const pets = await Promise.all(ids.map((id) => getPetById(id)))
  return pets.filter(Boolean)
}

export async function updatePetStatus(id, status, adopterId) {
  await updateDoc(doc(db, 'pets', id), adopterId ? { status, adopterId } : { status })
}

export async function deletePet(id) {
  await deleteDoc(doc(db, 'pets', id))
}
