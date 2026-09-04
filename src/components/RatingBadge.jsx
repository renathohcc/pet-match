function RatingBadge({ average, count }) {
  if (!count) return null

  return (
    <span className="text-[13px] font-semibold text-terracotta">
      ⭐ {average.toFixed(1)} · {count} avaliaç{count === 1 ? 'ão' : 'ões'}
    </span>
  )
}

export default RatingBadge
