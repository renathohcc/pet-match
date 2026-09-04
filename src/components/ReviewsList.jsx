import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPublicProfile } from '../lib/users'
import { getPetById } from '../lib/pets'

const DIRECTION_LABEL = {
  adopter_to_donor: 'Avaliação como doador(a)',
  donor_to_adopter: 'Avaliação como adotante',
}

function Stars({ rating }) {
  return (
    <span className="text-terracotta" aria-label={`${rating} de 5 estrelas`}>
      {'★'.repeat(rating)}
      <span className="text-line">{'★'.repeat(5 - rating)}</span>
    </span>
  )
}

function ReviewsList({ reviews }) {
  const [enriched, setEnriched] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- feedback imediato de loading
    setLoading(true)

    Promise.all(
      reviews.map(async (review) => {
        const [reviewer, pet] = await Promise.all([
          getPublicProfile(review.fromUserId),
          getPetById(review.petId),
        ])
        return { ...review, reviewer, petName: pet?.name ?? null }
      })
    ).then((result) => {
      if (!cancelled) {
        setEnriched(result)
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [reviews])

  if (loading) {
    return <p className="text-[13.5px] text-ink-soft">Carregando avaliações...</p>
  }

  if (enriched.length === 0) {
    return <p className="text-[13.5px] text-ink-soft">Ainda sem avaliações.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      {enriched.map((review, i) => (
        <div key={i} className="rounded-xl border border-line bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              {review.reviewer.photoURL ? (
                <img src={review.reviewer.photoURL} alt="" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-mid text-xs font-semibold text-white">
                  {review.reviewer.displayName[0]}
                </span>
              )}
              <div>
                <Link to={`/usuario/${review.fromUserId}`} className="text-[13.5px] font-semibold text-blue-deep hover:underline">
                  {review.reviewer.displayName}
                </Link>
                <div className="text-[12px] text-ink-soft">{DIRECTION_LABEL[review.direction]}</div>
              </div>
            </div>
            <Stars rating={review.rating} />
          </div>

          {review.comment && <p className="mt-3 text-[13.5px] text-ink">{review.comment}</p>}

          {review.petName && (
            <Link to={`/pet/${review.petId}`} className="mt-2 inline-block text-[12px] text-blue-mid hover:underline">
              Sobre a adoção de {review.petName}
            </Link>
          )}
        </div>
      ))}
    </div>
  )
}

export default ReviewsList
