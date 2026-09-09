import { addDoc, collection, doc, getDocs, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore'
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
    status: 'aberta',
    createdAt: serverTimestamp(),
  })
}

/** Todas as denúncias, mais recentes primeiro — usado no painel admin. */
export async function listAllReports() {
  const q = query(reportsRef, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

/**
 * Resolve a denúncia mudando o status (mantém histórico de moderação — não
 * apaga mais). `outcome`: 'resolvida' (ação tomada) ou 'descartada' (sem
 * procedência).
 */
export async function resolveReport(reportId, resolvedBy, outcome = 'resolvida') {
  await updateDoc(doc(db, 'reports', reportId), {
    status: outcome,
    resolvedBy,
    resolvedAt: serverTimestamp(),
  })
}

/** Denúncia ainda em aberto? (denúncias antigas sem o campo `status` contam como abertas.) */
export function isOpenReport(report) {
  return report.status !== 'resolvida' && report.status !== 'descartada'
}
