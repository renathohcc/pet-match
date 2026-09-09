import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useSearchParams } from 'react-router-dom'
import Container from '../components/Container'
import Button from '../components/Button'
import { useAuth } from '../context/useAuth'
import { submitReport, REPORT_REASONS } from '../lib/reports'

function Denunciar() {
  const { user, loading, loginWithGoogle } = useAuth()
  const [searchParams] = useSearchParams()
  const petId = searchParams.get('petId') || ''
  const petName = searchParams.get('petName') || ''

  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!reason) return
    setSending(true)
    setError('')
    try {
      const res = await submitReport({ petId, petName, reportedBy: user.uid, reason, details })
      if (res.alreadyReported) {
        setError('Você já denunciou este anúncio — nossa equipe vai analisar.')
        return
      }
      setSent(true)
    } catch (err) {
      setError(
        err?.code === 'permission-denied'
          ? 'Você enviou denúncias rápido demais. Espere alguns segundos e tente de novo.'
          : 'Não foi possível enviar a denúncia agora. Tente novamente em instantes.'
      )
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <Container>
        <div className="py-20 text-center text-ink-soft">Carregando...</div>
      </Container>
    )
  }

  return (
    <Container>
      <Helmet>
        <title>Denunciar anúncio — Adota.THE</title>
      </Helmet>

      <div className="mx-auto max-w-[560px] py-12">
        <h1 className="mb-2 font-display text-[32px] text-blue-deep">Denunciar anúncio</h1>
        <p className="mb-9 text-ink-soft">
          Viu algo suspeito, um anúncio falso ou indício de maus-tratos? Conte pra gente — nossa equipe analisa cada
          denúncia manualmente.
        </p>

        {!user ? (
          <div className="rounded-2xl border border-line bg-white p-6 text-center">
            <p className="mb-4 text-ink-soft">Entre com sua conta Google para enviar uma denúncia.</p>
            <Button variant="primary" onClick={() => loginWithGoogle()}>
              Entrar com Google
            </Button>
          </div>
        ) : sent ? (
          <div className="rounded-2xl border border-line bg-white p-6 text-center">
            <p className="mb-4 text-[15px] font-semibold text-blue-deep">Denúncia enviada. Obrigado por ajudar a manter o Adota.THE seguro. 🙏</p>
            <Link to="/buscar" className="text-blue-mid hover:underline">
              Voltar para a busca
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-2xl border border-line bg-white p-6">
            {petName && (
              <div className="rounded-lg bg-cream-2 px-3.5 py-2.5 text-[13.5px] text-ink-soft">
                Anúncio: <strong className="text-ink">{petName}</strong>
              </div>
            )}

            <div>
              <label className="mb-2 block text-[13.5px] font-semibold text-ink">Motivo da denúncia</label>
              <div className="flex flex-col gap-2">
                {Object.entries(REPORT_REASONS).map(([key, label]) => (
                  <label key={key} className="flex cursor-pointer items-center gap-2.5 text-[14px] text-ink">
                    <input
                      type="radio"
                      name="reason"
                      value={key}
                      checked={reason === key}
                      onChange={() => setReason(key)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[13.5px] font-semibold text-ink">Detalhes (opcional)</label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={4}
                placeholder="Descreva o que aconteceu..."
                className="w-full rounded-xl border border-line px-3.5 py-2.5 text-[14px] text-ink outline-none focus:border-blue-mid"
              />
            </div>

            {error && <p className="text-[13.5px] text-terracotta">{error}</p>}

            <Button type="submit" variant="terracotta" disabled={!reason || sending}>
              {sending ? 'Enviando...' : 'Enviar denúncia'}
            </Button>
          </form>
        )}
      </div>
    </Container>
  )
}

export default Denunciar
