import { useState } from 'react'
import Modal from './Modal'
import Button from './Button'

function InterestRequestDialog({ open, petName, article, onSubmit, onCancel }) {
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit(message.trim())
    } catch {
      setError('Não foi possível enviar seu interesse agora. Tente novamente.')
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onCancel}>
      <h3 className="mb-2.5 font-display text-lg text-blue-deep">Antes de manifestar interesse</h3>
      <p className="mb-4 text-[14.5px] text-ink-soft">
        Confirme que você tem condições de tempo, espaço e recursos para cuidar {article === 'do' ? 'do' : 'da'}{' '}
        {petName}, que seu interesse não tem fins de venda, abandono ou maus-tratos, e que sabe que o Adota.THE não
        intermedia nem se responsabiliza pelo acordo — o contato é feito direto com o responsável pelo pet.
      </p>

      <p className="mb-1.5 text-[13.5px] font-semibold text-ink">Por que você quer adotar {petName}? (opcional)</p>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Conte rapidamente sobre você — ajuda o doador a decidir mais rápido..."
        className="mb-4 w-full rounded-[10px] border-[1.4px] border-line bg-white px-3.5 py-3 font-sans text-[14.5px] text-ink"
        rows={3}
      />

      {error && <p className="mb-4 text-sm text-terracotta">{error}</p>}

      <div className="flex justify-end gap-2.5">
        <Button variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Enviando...' : 'Tenho interesse →'}
        </Button>
      </div>
    </Modal>
  )
}

export default InterestRequestDialog
