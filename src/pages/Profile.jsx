import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import Container from '../components/Container'
import Button from '../components/Button'
import ProfileForm from '../components/ProfileForm'
import { GridPetCard } from '../components/PetCard'
import RatingBadge from '../components/RatingBadge'
import ReviewsList from '../components/ReviewsList'
import { getPetsByIds, listMyPets, PET_STATUSES } from '../lib/pets'
import { TUTOR_TYPES, updateUserProfile } from '../lib/users'
import { getUserRatingSummary } from '../lib/reviews'
import { useAuth } from '../context/useAuth'
import { useFavorites } from '../context/useFavorites'
import { useProfile } from '../context/useProfile'

function Profile() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const { favoriteIds } = useFavorites()

  const [myPets, setMyPets] = useState([])
  const [myPetsLoading, setMyPetsLoading] = useState(true)
  const [myPetsError, setMyPetsError] = useState(null)

  const [favoritePets, setFavoritePets] = useState([])
  const [favoritesLoading, setFavoritesLoading] = useState(true)
  const [favoritesError, setFavoritesError] = useState(null)

  const [rating, setRating] = useState({ average: 0, count: 0, reviews: [] })

  const [editing, setEditing] = useState(false)

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- feedback imediato de loading
    setMyPetsLoading(true)
    setMyPetsError(null)

    listMyPets(user.uid)
      .then((result) => {
        if (!cancelled) setMyPets(result)
      })
      .catch(() => {
        if (!cancelled) setMyPetsError('Não foi possível carregar seus pets agora. Tente novamente em instantes.')
      })
      .finally(() => {
        if (!cancelled) setMyPetsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user.uid])

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- feedback imediato de loading
    setFavoritesLoading(true)
    setFavoritesError(null)

    getPetsByIds(favoriteIds)
      .then((result) => {
        if (!cancelled) setFavoritePets(result)
      })
      .catch(() => {
        if (!cancelled) setFavoritesError('Não foi possível carregar seus favoritos agora. Tente novamente em instantes.')
      })
      .finally(() => {
        if (!cancelled) setFavoritesLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [favoriteIds])

  useEffect(() => {
    let cancelled = false
    getUserRatingSummary(user.uid).then((summary) => {
      if (!cancelled) setRating(summary)
    })
    return () => {
      cancelled = true
    }
  }, [user.uid])

  async function handleSaveProfile(profileData) {
    await updateUserProfile(user.uid, profileData)
    setEditing(false)
  }

  if (!profile) {
    return (
      <Container>
        <div className="py-20 text-center text-ink-soft">Carregando...</div>
      </Container>
    )
  }

  return (
    <Container>
      <Helmet>
        <title>Meu perfil — Adota.THE</title>
      </Helmet>

      {!editing ? (
        <div className="flex flex-wrap items-center justify-between gap-4 pb-2 pt-9">
          <div className="flex items-center gap-4">
            {profile.photoURL ? (
              <img src={profile.photoURL} alt={profile.displayName} className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-mid text-xl font-semibold text-white">
                {(profile.displayName || 'U')[0]}
              </span>
            )}
            <div>
              <h1 className="font-display text-[28px] text-blue-deep">{profile.displayName}</h1>
              <p className="text-[14.5px] text-ink-soft">{user.email}</p>
              <p className="mt-1 text-[13px] font-semibold text-terracotta">{TUTOR_TYPES[profile.tutorType]}</p>
              <div className="mt-1">
                <RatingBadge average={rating.average} count={rating.count} />
              </div>
            </div>
          </div>
          <Button variant="ghost" onClick={() => setEditing(true)}>
            ✎ Editar perfil
          </Button>
        </div>
      ) : (
        <div className="mx-auto max-w-[480px] pb-2 pt-9">
          <h1 className="mb-6 font-display text-2xl text-blue-deep">Editar perfil</h1>
          <ProfileForm
            initialName={profile.displayName}
            initialPhotoURL={profile.photoURL}
            initialTutorType={profile.tutorType}
            submitLabel="Salvar"
            onSubmit={handleSaveProfile}
            onCancel={() => setEditing(false)}
          />
        </div>
      )}

      <section className="py-10">
        <h2 className="mb-6 font-display text-[22px] text-blue-deep">Meus pets cadastrados</h2>

        {myPetsLoading && <p className="text-ink-soft">Carregando...</p>}
        {myPetsError && <p className="text-terracotta">{myPetsError}</p>}

        {!myPetsLoading && !myPetsError && myPets.length === 0 && (
          <p className="text-ink-soft">Você ainda não cadastrou nenhum pet.</p>
        )}

        {!myPetsLoading && !myPetsError && myPets.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {myPets.map((pet) => (
              <GridPetCard key={pet.id} pet={pet} statusLabel={PET_STATUSES[pet.status] ?? pet.status} />
            ))}
          </div>
        )}
      </section>

      <section className="pb-16">
        <h2 className="mb-6 font-display text-[22px] text-blue-deep">Meus pets favoritos</h2>

        {favoritesLoading && <p className="text-ink-soft">Carregando...</p>}
        {favoritesError && <p className="text-terracotta">{favoritesError}</p>}

        {!favoritesLoading && !favoritesError && favoritePets.length === 0 && (
          <p className="text-ink-soft">Você ainda não favoritou nenhum pet.</p>
        )}

        {!favoritesLoading && !favoritesError && favoritePets.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {favoritePets.map((pet) => (
              <GridPetCard key={pet.id} pet={pet} />
            ))}
          </div>
        )}
      </section>

      <section className="pb-16">
        <h2 className="mb-6 font-display text-[22px] text-blue-deep">Avaliações que recebi</h2>
        <ReviewsList reviews={rating.reviews} />
      </section>
    </Container>
  )
}

export default Profile
