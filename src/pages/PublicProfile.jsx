import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import Container from '../components/Container'
import RatingBadge from '../components/RatingBadge'
import ReviewsList from '../components/ReviewsList'
import { getPublicProfile, TUTOR_TYPES } from '../lib/users'
import { getUserRatingSummary } from '../lib/reviews'

function PublicProfile() {
  const { uid } = useParams()
  const [profile, setProfile] = useState(null)
  const [rating, setRating] = useState({ average: 0, count: 0, reviews: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- feedback imediato de loading
    setLoading(true)
    setError(null)

    Promise.all([getPublicProfile(uid), getUserRatingSummary(uid)])
      .then(([profileResult, ratingResult]) => {
        if (cancelled) return
        setProfile(profileResult)
        setRating(ratingResult)
      })
      .catch(() => {
        if (!cancelled) setError('Não foi possível carregar esse perfil agora. Tente novamente em instantes.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [uid])

  if (loading) {
    return (
      <Container>
        <div className="py-20 text-center text-ink-soft">Carregando...</div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container>
        <div className="py-20 text-center text-terracotta">{error}</div>
      </Container>
    )
  }

  return (
    <Container>
      <Helmet>
        <title>{profile.displayName} — PetMatch</title>
      </Helmet>

      <div className="flex items-center gap-4 pb-2 pt-9">
        {profile.photoURL ? (
          <img src={profile.photoURL} alt={profile.displayName} className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-mid text-xl font-semibold text-white">
            {profile.displayName[0]}
          </span>
        )}
        <div>
          <h1 className="font-display text-[28px] text-blue-deep">{profile.displayName}</h1>
          <p className="text-[13px] font-semibold text-terracotta">{TUTOR_TYPES[profile.tutorType]}</p>
          <div className="mt-1">
            <RatingBadge average={rating.average} count={rating.count} />
            {rating.count === 0 && <span className="text-[13px] text-ink-soft">Ainda sem avaliações</span>}
          </div>
        </div>
      </div>

      <section className="py-10">
        <h2 className="mb-6 font-display text-[22px] text-blue-deep">Avaliações recebidas</h2>
        <ReviewsList reviews={rating.reviews} />
      </section>
    </Container>
  )
}

export default PublicProfile
