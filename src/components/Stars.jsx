/** Estrelas de avaliação (1-5) — usado no Admin e em ReviewsList. */
function Stars({ rating }) {
  return (
    <span className="text-terracotta" aria-label={`${rating} de 5 estrelas`}>
      {'★'.repeat(rating)}
      <span className="text-line">{'★'.repeat(5 - rating)}</span>
    </span>
  )
}

export default Stars
