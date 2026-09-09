import { useEffect } from 'react'

/**
 * Base de modal reutilizável — resolve fechar com Esc, fechar com clique no
 * backdrop e travar o scroll do body enquanto aberto. `ConfirmDialog`,
 * `ReviewDialog`, `DisputeDialog`, `InterestRequestDialog` e o modal de
 * compartilhar do `PetDetail.jsx` usam essa base por dentro.
 *
 * `children` é o conteúdo do cartão (título/corpo/botões) — o cartão em si
 * (tamanho, fundo, padding) é customizável via `cardClassName` pra cobrir
 * tanto os dialogs padrão (branco, `max-w-[380px]`) quanto casos com layout
 * próprio, como o de compartilhar (fundo creme, scroll interno, botão X).
 */
function Modal({
  open,
  onClose,
  children,
  cardClassName = 'w-full max-w-[380px] rounded-2xl bg-white p-6.5 shadow-[0_20px_40px_rgba(22,50,79,.2)]',
  overlayClassName = 'items-center',
  closeOnBackdrop = true,
  showCloseButton = false,
}) {
  useEffect(() => {
    if (!open) return undefined

    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', handleKeyDown)

    // Trava o scroll da página de fundo enquanto o modal está aberto — evita
    // o celular "confundir" o scroll da página com o scroll interno do modal.
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center bg-black/40 p-4 ${overlayClassName}`}
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div className={`relative ${cardClassName}`} onClick={(e) => e.stopPropagation()}>
        {showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="absolute right-4 top-4 z-10 cursor-pointer rounded-full bg-white/90 px-2.5 py-1 text-xl leading-none text-ink-soft shadow-sm hover:text-blue-deep"
          >
            ×
          </button>
        )}
        {children}
      </div>
    </div>
  )
}

export default Modal
