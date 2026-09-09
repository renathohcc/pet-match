import Modal from './Modal'
import Button from './Button'

function ConfirmDialog({ open, title, message, confirmLabel = 'Confirmar', danger = false, onConfirm, onCancel }) {
  return (
    <Modal open={open} onClose={onCancel}>
      <h3 className="mb-2.5 font-display text-lg text-blue-deep">{title}</h3>
      <p className="mb-6 text-[14.5px] text-ink-soft">{message}</p>
      <div className="flex justify-end gap-2.5">
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button variant={danger ? 'terracotta' : 'primary'} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}

export default ConfirmDialog
