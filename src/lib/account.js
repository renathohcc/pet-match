import { collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, where, writeBatch } from 'firebase/firestore'
import { deleteUser, reauthenticateWithPopup } from 'firebase/auth'
import { auth, db, googleProvider } from './firebase'
import { listMyPets } from './pets'

/**
 * Exclusão de conta (LGPD). Sem backend, o cliente apaga o que consegue:
 * perfil, pets ainda disponíveis (+ contatos), pedidos de interesse (feitos
 * e recebidos), notificações próprias e a conta de login. O que fica preso a
 * histórico (pets adotados + avaliações) vai num `deletionRequests/{uid}` pro
 * admin concluir o erasure manualmente.
 *
 * `deleteUser` pode exigir login recente — nesse caso reautentica via popup
 * e tenta de novo.
 */
export async function deleteMyAccount() {
  const user = auth.currentUser
  if (!user) throw new Error('Não autenticado.')
  const uid = user.uid

  const [pets, madeInterests, receivedInterests, myNotifs] = await Promise.all([
    listMyPets(uid),
    getDocs(query(collection(db, 'interests'), where('userId', '==', uid))),
    getDocs(query(collection(db, 'interests'), where('donorId', '==', uid))),
    getDocs(query(collection(db, 'notifications'), where('userId', '==', uid))),
  ])

  const adoptedPetIds = pets.filter((p) => p.status === 'adotado').map((p) => p.id)
  const removablePets = pets.filter((p) => p.status !== 'adotado')

  const batch = writeBatch(db)
  for (const pet of removablePets) batch.delete(doc(db, 'pets', pet.id))
  for (const snap of [madeInterests, receivedInterests]) snap.forEach((d) => batch.delete(d.ref))
  myNotifs.forEach((d) => batch.delete(d.ref))
  batch.set(doc(db, 'deletionRequests', uid), {
    uid,
    email: user.email || null,
    displayName: user.displayName || null,
    requestedAt: serverTimestamp(),
    adoptedPetIds,
    status: 'pendente',
  })
  batch.delete(doc(db, 'users', uid))
  await batch.commit()

  // petContacts: a regra nega delete de doc inexistente, então é best-effort
  // fora do batch (um contato órfão a mais não impede a exclusão).
  await Promise.allSettled(removablePets.map((p) => deleteDoc(doc(db, 'petContacts', p.id))))

  try {
    await deleteUser(user)
  } catch (err) {
    if (err?.code === 'auth/requires-recent-login') {
      await reauthenticateWithPopup(user, googleProvider)
      await deleteUser(user)
    } else {
      throw err
    }
  }
}

/** Pedidos de exclusão em aberto — painel admin. */
export async function listDeletionRequests() {
  const q = query(collection(db, 'deletionRequests'), orderBy('requestedAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

/** Admin marca o erasure como concluído (depois de apagar pets adotados + avaliações na mão). */
export async function resolveDeletionRequest(uid) {
  await deleteDoc(doc(db, 'deletionRequests', uid))
}
