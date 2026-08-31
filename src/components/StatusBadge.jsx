function StatusBadge({ status = 'Disponível' }) {
  return (
    <span className="rounded-full bg-[#E7F1EA] px-3 py-1.5 text-[13px] font-bold text-green">
      ● {status}
    </span>
  )
}

export default StatusBadge
