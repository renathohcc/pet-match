const sizes = {
  sm: 'px-3.5 py-[7px] text-[13px]',
  md: 'px-4.5 py-2.5 text-sm',
}

/**
 * Pill/chip clicável reutilizável — usado em filtros (Buscar), seleção de
 * opções (Cadastrar, ProfileForm), abas (Admin) e status (PetDetail).
 * Base é um <button> de verdade (não <span onClick>) pra foco e Enter/Espaço
 * funcionarem sem esforço extra.
 */
function Chip({ active = false, size = 'sm', className = '', children, ...props }) {
  return (
    <button
      type="button"
      className={`cursor-pointer rounded-full border-[1.3px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${sizes[size]} ${
        active
          ? 'border-blue-deep bg-blue-deep text-cream'
          : 'border-line bg-white text-ink-soft hover:border-blue-deep hover:text-blue-deep'
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default Chip
