import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPublicProfile } from '../lib/users'
import { getPetById } from '../lib/pets'
import { disputeReview, getReviewDispute } from '../lib/reviews'
import { useAuth } from '../context/useAuth'
import DisputeDialog from './DisputeDialog'

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
  const { user } = useAuth()
  const [enriched, setEnriched] = useState([])
  const [loading, setLoading] = useState(true)
  const [disputeTarget, setDisputeTarget] = useState(null) // { petId, direction } | null

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- feedback imediato de loading
    setLoading(true)

    Promise.all(
      reviews.map(async (review) => {
        const [reviewer, pet, dispute] = await Promise.all([
          getPublicProfile(review.fromUserId),
          getPetById(review.petId),
          getReviewDispute(review.petId, review.direction),
        ])
        return { ...review, reviewer, petName: pet?.name ?? null, dispute }
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

  async function handleDisputeSubmit(reason) {
    const { petId, direction } = disputeTarget
    await disputeReview(petId, direction, user.uid, reason)
    setEnriched((prev) =>
      prev.map((r) =>
        r.petId === petId && r.direction === direction ? { ...r, dispute: { disputedBy: user.uid, reason } } : r
      )
    )
    setDisputeTarget(null)
  }

  if (loading) {
    return <p className="text-[13.5px] text-ink-soft">Carregando avaliações...</p>
  }

  if (enriched.length === 0) {
    return <p className="text-[13.5px] text-ink-soft">Ainda sem avaliações.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      {enriched.map((review, i) => {
        const canDispute = user && user.uid === review.toUserId && !review.dispute

        return (
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

            {review.dispute ? (
              <p className="mt-3 text-[13.5px] italic text-ink-soft">
                ⚠️ Comentário oculto — em análise por conta de um recurso.
              </p>
            ) : (
              review.comment && <p className="mt-3 text-[13.5px] text-ink">{review.comment}</p>
            )}

            <div className="mt-2 flex items-center justify-between gap-2">
              {review.petName ? (
                <Link to={`/pet/${review.petId}`} className="text-[12px] text-blue-mid hover:underline">
                  Sobre a adoção de {review.petName}
                </Link>
              ) : (
                <span />
              )}

              {canDispute && (
                <button
                  type="button"
                  onClick={() => setDisputeTarget({ petId: review.petId, direction: review.direction })}
                  className="cursor-pointer text-[12px] font-semibold text-terracotta hover:underline"
                >
                  🚩 Recorrer
                </button>
              )}
            </div>
          </div>
        )
      })}

      <DisputeDialog open={Boolean(disputeTarget)} onSubmit={handleDisputeSubmit} onCancel={() => setDisputeTarget(null)} />
    </div>
  )
}

export default ReviewsList
