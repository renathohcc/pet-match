import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import Container from '../components/Container'
import Button from '../components/Button'
import ConfirmDialog from '../components/ConfirmDialog'
import ProfileForm from '../components/ProfileForm'
import { GridPetCard } from '../components/PetCard'
import RatingBadge from '../components/RatingBadge'
import ReviewsList from '../components/ReviewsList'
import { getPetsByIds, listMyPets, PET_STATUSES } from '../lib/pets'
import { TUTOR_TYPES, updateUserProfile } from '../lib/users'
import { getUserRatingSummary } from '../lib/reviews'
import { deleteMyAccount } from '../lib/account'
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
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

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

  async function handleDeleteAccount() {
    setConfirmDelete(false)
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteMyAccount()
      // onAuthStateChanged limpa a sessão e o app redireciona sozinho.
      window.location.assign(import.meta.env.BASE_URL)
    } catch (err) {
      setDeleting(false)
      setConfirmDelete(false)
      setDeleteError(
        err?.code === 'auth/popup-closed-by-user'
          ? 'Confirmação de identidade cancelada. Sua conta não foi excluída.'
          : 'Não foi possível concluir a exclusão agora. Parte dos dados pode ter sido removida — tente de novo ou fale com a gente pelo e-mail da Política de Privacidade.'
      )
    }
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

      <section className="mb-16 rounded-2xl border border-terracotta/40 bg-cream-2 p-6">
        <h2 className="font-display text-[18px] text-blue-deep">Excluir minha conta</h2>
        <p className="mt-2 max-w-[560px] text-[13.5px] text-ink-soft">
          Apaga seu perfil, seus anúncios ainda disponíveis, seus pedidos de interesse e sua conta de login.
          Anúncios já adotados e avaliações públicas ficam registrados para a moderação concluir a remoção.
          Essa ação não pode ser desfeita.
        </p>
        {deleteError && <p className="mt-3 text-[13.5px] text-terracotta">{deleteError}</p>}
        <div className="mt-4">
          <Button variant="terracotta" onClick={() => setConfirmDelete(true)} disabled={deleting}>
            {deleting ? 'Excluindo...' : 'Excluir minha conta'}
          </Button>
        </div>
      </section>

      <ConfirmDialog
        open={confirmDelete}
        title="Excluir sua conta?"
        message="Vamos apagar seu perfil, anúncios disponíveis, pedidos de interesse e o login. Pode ser que a gente peça pra você confirmar a identidade com o Google. Não dá pra desfazer."
        confirmLabel="Sim, excluir"
        danger
        onConfirm={handleDeleteAccount}
        onCancel={() => setConfirmDelete(false)}
      />
    </Container>
  )
}

export default Profile
