import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import Container from '../components/Container'
import Button from '../components/Button'
import Chip from '../components/Chip'
import Stars from '../components/Stars'
import ConfirmDialog from '../components/ConfirmDialog'
import { getSiteStats } from '../lib/adminStats'
import { listAllUsers, getPublicProfile, TUTOR_TYPES } from '../lib/users'
import { listMyPets } from '../lib/pets'
import { deleteReview, getUserRatingSummary, listAllDisputes, listAllReviews, rejectDispute, upholdDispute } from '../lib/reviews'
import { isOpenReport, listAllReports, resolveReport, REPORT_REASONS } from '../lib/reports'
import { useAuth } from '../context/useAuth'

const TABS = [
  { id: 'metrics', label: '📊 Métricas' },
  { id: 'users', label: '👤 Usuários' },
  { id: 'reviews', label: '⭐ Avaliações' },
  { id: 'disputes', label: '🚩 Recursos' },
  { id: 'reports', label: '📣 Denúncias' },
]

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <div className="font-display text-3xl text-blue-deep">{value}</div>
      <div className="mt-1 text-[13px] text-ink-soft">{label}</div>
    </div>
  )
}

// Rótulos amigáveis pra exibir as respostas da pesquisa pós-adoção (ver
// SURVEY_QUESTIONS em src/components/ReviewDialog.jsx — mantidos em sincronia).
const SURVEY_LABELS = {
  facilitou: 'O Adota.THE facilitou encontrar um adotante?',
  voltariaUsar: 'Voltaria a usar o Adota.THE?',
  processoLivre: 'Sobre o processo',
  correspondeuAnuncio: 'O pet correspondia ao anúncio?',
  jaTinhaPet: 'Já tinha outro pet em casa?',
  experiencia: 'Costume de ter animais',
}

function SurveyAnswers({ survey }) {
  const entries = Object.entries(survey ?? {}).filter(([, value]) => value)
  if (entries.length === 0) return null

  return (
    <div className="mt-2.5 rounded-lg bg-cream-2 p-3 text-[12.5px]">
      <div className="mb-1.5 font-semibold text-ink-soft">Pesquisa pós-adoção:</div>
      <dl className="flex flex-col gap-1">
        {entries.map(([key, value]) => (
          <div key={key}>
            <dt className="inline text-ink-soft">{SURVEY_LABELS[key] ?? key}: </dt>
            <dd className="inline font-medium text-ink">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function MetricsTab() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSiteStats().then((result) => {
      setStats(result)
      setLoading(false)
    })
  }, [])

  if (loading) return <p className="text-ink-soft">Carregando métricas...</p>

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      <StatCard label="Pets cadastrados (total)" value={stats.totalPets} />
      <StatCard label="Disponíveis" value={stats.petsByStatus.disponivel} />
      <StatCard label="Adotados" value={stats.petsByStatus.adotado} />
      <StatCard label="Usuários cadastrados" value={stats.totalUsers} />
      <StatCard label="Avaliações" value={stats.totalReviews} />
      <StatCard label="Recursos pendentes" value={stats.pendingDisputes} />
    </div>
  )
}

function UsersTab() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listAllUsers().then(async (list) => {
      const enriched = await Promise.all(
        list.map(async (u) => {
          const [pets, rating] = await Promise.all([listMyPets(u.uid), getUserRatingSummary(u.uid)])
          return { ...u, petCount: pets.length, rating }
        })
      )
      setUsers(enriched)
      setLoading(false)
    })
  }, [])

  if (loading) return <p className="text-ink-soft">Carregando usuários...</p>
  if (users.length === 0) return <p className="text-ink-soft">Nenhum usuário ainda.</p>

  return (
    <div className="flex flex-col gap-2.5">
      {users.map((u) => (
        <div key={u.uid} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white p-4">
          <div className="flex items-center gap-3">
            {u.photoURL ? (
              <img src={u.photoURL} alt="" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-mid text-sm font-semibold text-white">
                {(u.displayName || 'U')[0]}
              </span>
            )}
            <div>
              <div className="text-[14.5px] font-semibold text-ink">{u.displayName}</div>
              <div className="text-[12.5px] text-ink-soft">{TUTOR_TYPES[u.tutorType] ?? u.tutorType}</div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-[13px] text-ink-soft">
            <span>{u.petCount} pet(s)</span>
            <span>{u.rating.count > 0 ? `⭐ ${u.rating.average.toFixed(1)} (${u.rating.count})` : 'sem avaliações'}</span>
            <Link to={`/usuario/${u.uid}`} className="font-semibold text-blue-mid hover:underline">
              Ver perfil
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}

function ReviewsTab() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmTarget, setConfirmTarget] = useState(null)

  function loadReviews() {
    setLoading(true)
    listAllReviews().then(async (list) => {
      const enriched = await Promise.all(
        list.map(async (r) => {
          const [from, to] = await Promise.all([getPublicProfile(r.fromUserId), getPublicProfile(r.toUserId)])
          return { ...r, fromName: from.displayName, toName: to.displayName }
        })
      )
      setReviews(enriched)
      setLoading(false)
    })
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial da lista
    loadReviews()
  }, [])

  async function handleDelete() {
    const target = confirmTarget
    await deleteReview(target.petId, target.direction)
    // Atualização otimista: remove só o item excluído da lista local em vez
    // de refazer todo o ciclo de N+1 (listAllReviews + getPublicProfile por
    // review) de novo.
    setReviews((prev) => prev.filter((r) => !(r.petId === target.petId && r.direction === target.direction)))
    setConfirmTarget(null)
  }

  if (loading) return <p className="text-ink-soft">Carregando avaliações...</p>
  if (reviews.length === 0) return <p className="text-ink-soft">Nenhuma avaliação ainda.</p>

  return (
    <div className="flex flex-col gap-2.5">
      {reviews.map((r) => (
        <div key={r.id} className="rounded-xl border border-line bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="text-[13.5px]">
              <strong className="text-ink">{r.fromName}</strong>
              <span className="text-ink-soft"> avaliou </span>
              <strong className="text-ink">{r.toName}</strong>
            </div>
            <Stars rating={r.rating} />
          </div>
          {r.comment && <p className="mt-2 text-[13.5px] text-ink-soft">{r.comment}</p>}
          <SurveyAnswers survey={r.survey} />
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <Link to={`/pet/${r.petId}`} className="text-[12px] text-blue-mid hover:underline">
              Ver pet
            </Link>
            <button
              type="button"
              onClick={() => setConfirmTarget({ petId: r.petId, direction: r.direction })}
              className="cursor-pointer text-[12px] font-semibold text-terracotta hover:underline"
            >
              🗑 Excluir
            </button>
          </div>
        </div>
      ))}

      <ConfirmDialog
        open={Boolean(confirmTarget)}
        title="Excluir avaliação"
        message="Tem certeza que deseja excluir essa avaliação permanentemente?"
        confirmLabel="Excluir"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  )
}

function DisputesTab() {
  const [disputes, setDisputes] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmAction, setConfirmAction] = useState(null) // { type: 'reject' | 'uphold', dispute } | null

  function loadDisputes() {
    setLoading(true)
    listAllDisputes().then(async (list) => {
      const enriched = await Promise.all(
        list.map(async (d) => {
          const [from, to, disputer] = await Promise.all([
            getPublicProfile(d.fromUserId),
            getPublicProfile(d.toUserId),
            getPublicProfile(d.disputedBy),
          ])
          return { ...d, fromName: from.displayName, toName: to.displayName, disputerName: disputer.displayName }
        })
      )
      setDisputes(enriched)
      setLoading(false)
    })
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial da lista
    loadDisputes()
  }, [])

  async function handleConfirm() {
    const { type, dispute } = confirmAction
    if (type === 'reject') {
      await rejectDispute(dispute.petId, dispute.direction)
    } else {
      await upholdDispute(dispute.petId, dispute.direction)
    }
    // Nos dois casos o recurso deixa de existir (rejeitado = só o recurso
    // some; procede = review + recurso somem) — atualização otimista local
    // em vez de refazer o N+1 (listAllDisputes + 3x getPublicProfile por
    // recurso) inteiro de novo.
    setDisputes((prev) => prev.filter((d) => !(d.petId === dispute.petId && d.direction === dispute.direction)))
    setConfirmAction(null)
  }

  if (loading) return <p className="text-ink-soft">Carregando recursos...</p>
  if (disputes.length === 0) return <p className="text-ink-soft">Nenhum recurso em aberto. 🎉</p>

  return (
    <div className="flex flex-col gap-3">
      {disputes.map((d) => (
        <div key={d.id} className="rounded-xl border border-terracotta/40 bg-cream-2 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="text-[13.5px]">
              <strong className="text-ink">{d.fromName}</strong>
              <span className="text-ink-soft"> avaliou </span>
              <strong className="text-ink">{d.toName}</strong>
            </div>
            <Stars rating={d.rating} />
          </div>

          {d.comment && <p className="mt-2 text-[13.5px] text-ink-soft italic">"{d.comment}"</p>}

          <div className="mt-3 rounded-lg bg-white p-3">
            <div className="text-[12px] font-semibold text-terracotta">Recurso de {d.disputerName}:</div>
            <p className="mt-1 text-[13.5px] text-ink">{d.reason}</p>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <Link to={`/pet/${d.petId}`} className="text-[12px] text-blue-mid hover:underline">
              Ver pet
            </Link>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setConfirmAction({ type: 'reject', dispute: d })}>
                Rejeitar recurso
              </Button>
              <Button variant="terracotta" onClick={() => setConfirmAction({ type: 'uphold', dispute: d })}>
                Remover avaliação
              </Button>
            </div>
          </div>
        </div>
      ))}

      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={confirmAction?.type === 'reject' ? 'Rejeitar recurso' : 'Remover avaliação'}
        message={
          confirmAction?.type === 'reject'
            ? 'O comentário volta a aparecer publicamente. Confirma que o recurso é indevido?'
            : 'A avaliação (nota + comentário) será excluída permanentemente. Confirma que o recurso procede?'
        }
        confirmLabel="Confirmar"
        danger={confirmAction?.type === 'uphold'}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  )
}

function ReportsTab() {
  const { user } = useAuth()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmTarget, setConfirmTarget] = useState(null)

  function loadReports() {
    setLoading(true)
    listAllReports().then(async (list) => {
      const open = list.filter(isOpenReport)
      const enriched = await Promise.all(
        open.map(async (r) => {
          const reporter = await getPublicProfile(r.reportedBy)
          return { ...r, reporterName: reporter.displayName }
        })
      )
      setReports(enriched)
      setLoading(false)
    })
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial da lista
    loadReports()
  }, [])

  async function handleResolve(outcome) {
    const target = confirmTarget
    await resolveReport(target.id, user.uid, outcome)
    setReports((prev) => prev.filter((r) => r.id !== target.id))
    setConfirmTarget(null)
  }

  if (loading) return <p className="text-ink-soft">Carregando denúncias...</p>
  if (reports.length === 0) return <p className="text-ink-soft">Nenhuma denúncia em aberto. 🎉</p>

  return (
    <div className="flex flex-col gap-3">
      {reports.map((r) => (
        <div key={r.id} className="rounded-xl border border-terracotta/40 bg-cream-2 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="text-[13.5px]">
              <strong className="text-ink">{r.reporterName}</strong>
              <span className="text-ink-soft"> denunciou </span>
              {r.petId ? (
                <Link to={`/pet/${r.petId}`} className="font-semibold text-blue-mid hover:underline">
                  {r.petName || r.petId}
                </Link>
              ) : (
                <strong className="text-ink">{r.petName || 'anúncio sem referência'}</strong>
              )}
            </div>
          </div>

          <div className="mt-2 text-[12px] font-semibold text-terracotta">{REPORT_REASONS[r.reason] ?? r.reason}</div>
          {r.details && <p className="mt-1 text-[13.5px] text-ink-soft">{r.details}</p>}

          <div className="mt-3 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmTarget({ ...r, outcome: 'descartada' })}>
              Descartar
            </Button>
            <Button variant="terracotta" onClick={() => setConfirmTarget({ ...r, outcome: 'resolvida' })}>
              Resolvida (ação tomada)
            </Button>
          </div>
        </div>
      ))}

      <ConfirmDialog
        open={Boolean(confirmTarget)}
        title={confirmTarget?.outcome === 'descartada' ? 'Descartar denúncia' : 'Marcar denúncia como resolvida'}
        message={
          confirmTarget?.outcome === 'descartada'
            ? 'A denúncia sai da lista mas fica no histórico (sem procedência).'
            : 'A denúncia sai da lista mas fica no histórico, registrando que houve ação.'
        }
        confirmLabel="Confirmar"
        onConfirm={() => handleResolve(confirmTarget.outcome)}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  )
}

function Admin() {
  const [tab, setTab] = useState('metrics')

  return (
    <Container>
      <Helmet>
        <title>Painel Admin — Adota.THE</title>
      </Helmet>

      <div className="pb-2 pt-9">
        <h1 className="font-display text-[28px] text-blue-deep">Painel Admin</h1>
      </div>

      <div className="mb-7.5 flex flex-wrap gap-2 border-b border-line pb-4">
        {TABS.map((t) => (
          <Chip key={t.id} size="md" active={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label}
          </Chip>
        ))}
      </div>

      <div className="pb-20">
        {tab === 'metrics' && <MetricsTab />}
        {tab === 'users' && <UsersTab />}
        {tab === 'reviews' && <ReviewsTab />}
        {tab === 'disputes' && <DisputesTab />}
        {tab === 'reports' && <ReportsTab />}
      </div>
    </Container>
  )
}

export default Admin
