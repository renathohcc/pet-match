import { PET_STATUSES } from '../lib/pets'

const styles = {
  disponivel: 'bg-[#E7F1EA] text-green',
  em_processo: 'bg-[#FCF0E4] text-terracotta',
  adotado: 'bg-[#EAEAEA] text-ink-soft',
}

function StatusBadge({ status = 'disponivel' }) {
  return (
    <span className={`rounded-full px-3 py-1.5 text-[13px] font-bold ${styles[status] ?? styles.disponivel}`}>
      ● {PET_STATUSES[status] ?? PET_STATUSES.disponivel}
    </span>
  )
}

export default StatusBadge
