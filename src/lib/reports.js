import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

export const REPORT_REASONS = {
  fraude: 'Suspeita de fraude/golpe',
  animal_doente: 'Animal aparenta maus-tratos ou doença grave não informada',
  anuncio_falso: 'Anúncio falso ou pet já adotado em outro lugar',
  conteudo_inadequado: 'Conteúdo inadequado (foto/descrição)',
  outro: 'Outro motivo',
}

const reportsRef = collection(db, 'reports')

/** Envia uma denúncia sobre um anúncio (exige login — ver firestore.rules). */
export async function submitReport({ petId, petName, reportedBy, reason, details }) {
  await addDoc(reportsRef, {
    petId: petId || null,
    petName: petName || '',
    reportedBy,
    reason,
    details: details || '',
    createdAt: serverTimestamp(),
  })
}

/** Todas as denúncias em aberto, mais recentes primeiro — usado no painel admin. */
export async function listAllReports() {
  const q = query(reportsRef, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

/** Marca como resolvida = remove a denúncia (sem histórico de moderação por enquanto). */
export async function resolveReport(reportId) {
  await deleteDoc(doc(db, 'reports', reportId))
}
