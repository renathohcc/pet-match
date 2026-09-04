import { useState } from 'react'
import Button from './Button'

function ReviewDialog({ open, targetName, onSubmit, onCancel }) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  if (!open) return null

  async function handleSubmit() {
    if (rating === 0) {
      setError('Escolha uma nota de 1 a 5 estrelas.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({ rating, comment })
    } catch {
      setError('Não foi possível enviar a avaliação agora. Tente novamente.')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-[380px] rounded-2xl bg-white p-6.5 shadow-[0_20px_40px_rgba(22,50,79,.2)]">
        <h3 className="mb-2.5 font-display text-lg text-blue-deep">Avaliar {targetName}</h3>
        <p className="mb-4 text-[14.5px] text-ink-soft">Como foi sua experiência com a adoção?</p>

        <div className="mb-4 flex justify-center gap-1.5 text-3xl">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHoverRating(n)}
              onMouseLeave={() => setHoverRating(0)}
              className="cursor-pointer leading-none"
              aria-label={`${n} estrela(s)`}
            >
              {n <= (hoverRating || rating) ? '★' : '☆'}
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Comentário (opcional)"
          className="mb-4 w-full rounded-[10px] border-[1.4px] border-line bg-white px-3.5 py-3 font-sans text-[14.5px] text-ink"
          rows={3}
        />

        {error && <p className="mb-4 text-sm text-terracotta">{error}</p>}

        <div className="flex justify-end gap-2.5">
          <Button variant="ghost" onClick={onCancel} disabled={submitting}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Enviando...' : 'Enviar avaliação'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ReviewDialog
