import Button from './Button'

function ConfirmDialog({ open, title, message, confirmLabel = 'Confirmar', danger = false, onConfirm, onCancel }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-[380px] rounded-2xl bg-white p-6.5 shadow-[0_20px_40px_rgba(22,50,79,.2)]">
        <h3 className="mb-2.5 font-display text-lg text-blue-deep">{title}</h3>
        <p className="mb-6 text-[14.5px] text-ink-soft">{message}</p>
        <div className="flex justify-end gap-2.5">
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            variant={danger ? 'terracotta' : 'primary'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
