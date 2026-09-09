import { useState } from 'react'
import Modal from './Modal'
import Button from './Button'
import Chip from './Chip'

// Pesquisa rápida pós-adoção, pra entender o perfil de usuários a médio/longo
// prazo — perguntas diferentes dependendo de quem está avaliando (doador
// avalia o processo, adotante avalia o pet/perfil dele mesmo). Gravada junto
// da review em reviews/{petId}_{direction}, campo `survey` (ver src/lib/reviews.js).
const SURVEY_QUESTIONS = {
  donor_to_adopter: [
    { key: 'facilitou', label: 'O Adota.THE facilitou encontrar um adotante?', options: ['Sim, muito', 'Mais ou menos', 'Não, foi difícil'] },
    { key: 'voltariaUsar', label: 'Você voltaria a usar o Adota.THE pra um próximo pet?', options: ['Sim', 'Não', 'Talvez'] },
  ],
  adopter_to_donor: [
    { key: 'correspondeuAnuncio', label: 'O pet correspondia ao que foi anunciado (fotos, descrição, temperamento)?', options: ['Sim, totalmente', 'Em parte', 'Não muito'] },
    { key: 'jaTinhaPet', label: 'Você já tinha outro pet em casa antes dessa adoção?', options: ['Sim', 'Não'] },
    { key: 'experiencia', label: 'Você tem costume de ter animais, ou essa foi sua primeira vez?', options: ['Já tive/tenho outros antes', 'Essa foi minha primeira vez'] },
  ],
}

function ReviewDialog({ open, targetName, direction, onSubmit, onCancel }) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [survey, setSurvey] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const questions = SURVEY_QUESTIONS[direction] ?? []

  function setAnswer(key, value) {
    setSurvey((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit() {
    if (rating === 0) {
      setError('Escolha uma nota de 1 a 5 estrelas.')
      return
    }
    const missing = questions.find((q) => !survey[q.key])
    if (missing) {
      setError('Responda todas as perguntas rápidas abaixo antes de enviar.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({ rating, comment, survey })
    } catch {
      setError('Não foi possível enviar a avaliação agora. Tente novamente.')
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onCancel}
      cardClassName="max-h-[85vh] w-full max-w-[420px] overflow-y-auto rounded-2xl bg-white p-6.5 shadow-[0_20px_40px_rgba(22,50,79,.2)]"
    >
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
        className="mb-5 w-full rounded-[10px] border-[1.4px] border-line bg-white px-3.5 py-3 font-sans text-[14.5px] text-ink"
        rows={3}
      />

      {questions.length > 0 && (
        <div className="mb-4 flex flex-col gap-4 border-t border-line pt-4">
          <p className="text-[12px] font-semibold text-ink-soft">
            Só mais algumas perguntas rápidas — nos ajuda a melhorar o Adota.THE:
          </p>
          {questions.map((q) => (
            <div key={q.key}>
              <label className="mb-2 block text-[13.5px] font-medium text-ink">{q.label}</label>
              <div className="flex flex-wrap gap-2">
                {q.options.map((opt) => (
                  <Chip key={opt} size="md" active={survey[q.key] === opt} onClick={() => setAnswer(q.key, opt)}>
                    {opt}
                  </Chip>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <p className="mb-4 text-sm text-terracotta">{error}</p>}

      <div className="flex justify-end gap-2.5">
        <Button variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Enviando...' : 'Enviar avaliação'}
        </Button>
      </div>
    </Modal>
  )
}

export default ReviewDialog
