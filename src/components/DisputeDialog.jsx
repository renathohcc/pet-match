import { useState } from 'react'
import Button from './Button'

function DisputeDialog({ open, onSubmit, onCancel }) {
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  if (!open) return null

  async function handleSubmit() {
    if (reason.trim().length < 10) {
      setError('Descreva com um pouco mais de detalhe (mínimo 10 caracteres).')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit(reason.trim())
    } catch {
      setError('Não foi possível enviar o recurso agora. Tente novamente.')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-[380px] rounded-2xl bg-white p-6.5 shadow-[0_20px_40px_rgba(22,50,79,.2)]">
        <h3 className="mb-2.5 font-display text-lg text-blue-deep">Recorrer desta avaliação</h3>
        <p className="mb-4 text-[14.5px] text-ink-soft">
          O comentário fica oculto do público até a nossa equipe analisar. Explique por que você acha que essa
          avaliação não reflete o que aconteceu de verdade.
        </p>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Conte o que aconteceu..."
          className="mb-4 w-full rounded-[10px] border-[1.4px] border-line bg-white px-3.5 py-3 font-sans text-[14.5px] text-ink"
          rows={4}
        />

        {error && <p className="mb-4 text-sm text-terracotta">{error}</p>}

        <div className="flex justify-end gap-2.5">
          <Button variant="ghost" onClick={onCancel} disabled={submitting}>
            Cancelar
          </Button>
          <Button variant="terracotta" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Enviando...' : 'Enviar recurso'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default DisputeDialog
