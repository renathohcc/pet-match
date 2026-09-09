import { collection, doc, getDoc, getDocs, increment, orderBy, query, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore'
import { db } from './firebase'
import { stampRateLimit } from './rateLimit'

export const REPORT_REASONS = {
  fraude: 'Suspeita de fraude/golpe',
  animal_doente: 'Animal aparenta maus-tratos ou doença grave não informada',
  anuncio_falso: 'Anúncio falso ou pet já adotado em outro lugar',
  conteudo_inadequado: 'Conteúdo inadequado (foto/descrição)',
  outro: 'Outro motivo',
}

const reportsRef = collection(db, 'reports')

/**
 * Denúncia sobre um anúncio. Quando há `petId`, o id do doc é determinístico
 * (`${petId}__${uid}`) — uma denúncia por pessoa por anúncio — e o mesmo batch
 * incrementa `pets/{petId}.reportCount` (pós-moderação: some da busca ao
 * acumular denúncias). Carimba o rate limit junto (a regra exige — ver
 * firestore.rules). Retorna `{ alreadyReported: true }` se a pessoa já
 * denunciou esse anúncio.
 */
export async function submitReport({ petId, petName, reportedBy, reason, details }) {
  const batch = writeBatch(db)
  stampRateLimit(batch, reportedBy, 'reportAt')

  const base = {
    petName: petName || '',
    reportedBy,
    reason,
    details: details || '',
    status: 'aberta',
    createdAt: serverTimestamp(),
  }

  if (petId) {
    const reportRef = doc(db, 'reports', `${petId}__${reportedBy}`)
    if ((await getDoc(reportRef)).exists()) return { alreadyReported: true }
    batch.set(reportRef, { ...base, petId })
    batch.update(doc(db, 'pets', petId), { reportCount: increment(1) })
  } else {
    batch.set(doc(reportsRef), { ...base, petId: null })
  }

  await batch.commit()
  return {}
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
