import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import Container from '../components/Container'
import Button from '../components/Button'
import { GridPetCard } from '../components/PetCard'
import { getPetsByIds, listMyPets, PET_STATUSES } from '../lib/pets'
import { TUTOR_TYPES, updateUserProfile } from '../lib/users'
import { uploadProfilePhoto } from '../lib/cloudinary'
import { useAuth } from '../context/useAuth'
import { useFavorites } from '../context/useFavorites'
import { useProfile } from '../context/useProfile'

const fieldClass =
  'w-full rounded-[10px] border-[1.4px] border-line bg-white px-3.5 py-3 font-sans text-[15px] text-ink'

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

  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editTutorType, setEditTutorType] = useState('independente')
  const [editPhotoFile, setEditPhotoFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

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

  function startEditing() {
    setSaveError(null)
    setEditPhotoFile(null)
    setEditName(profile.displayName)
    setEditTutorType(profile.tutorType)
    setEditing(true)
  }

  async function handleSaveProfile(e) {
    e.preventDefault()
    setSaving(true)
    setSaveError(null)

    try {
      const photoURL = editPhotoFile ? await uploadProfilePhoto(editPhotoFile) : profile.photoURL
      await updateUserProfile(user.uid, { displayName: editName, tutorType: editTutorType, photoURL })
      setEditing(false)
    } catch {
      setSaveError('Não foi possível salvar as alterações agora. Tente novamente.')
    } finally {
      setSaving(false)
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
        <title>Meu perfil — PetMatch</title>
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
            </div>
          </div>
          <Button variant="ghost" onClick={startEditing}>
            ✎ Editar perfil
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSaveProfile} className="mx-auto max-w-[480px] pb-2 pt-9">
          <h1 className="mb-6 font-display text-2xl text-blue-deep">Editar perfil</h1>

          <div className="mb-5 flex items-center gap-4">
            {(editPhotoFile ? URL.createObjectURL(editPhotoFile) : profile.photoURL) ? (
              <img
                src={editPhotoFile ? URL.createObjectURL(editPhotoFile) : profile.photoURL}
                alt=""
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-mid text-xl font-semibold text-white">
                {(editName || 'U')[0]}
              </span>
            )}
            <label className="cursor-pointer text-[13.5px] font-semibold text-blue-mid">
              Trocar foto
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setEditPhotoFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          <div className="mb-4">
            <label className="mb-1.5 block text-[13.5px] font-semibold text-ink">Nome de exibição</label>
            <input className={fieldClass} value={editName} onChange={(e) => setEditName(e.target.value)} required />
          </div>

          <div className="mb-6">
            <label className="mb-1.5 block text-[13.5px] font-semibold text-ink">Você é...</label>
            <div className="flex flex-wrap gap-2.5">
              {Object.entries(TUTOR_TYPES).map(([value, label]) => (
                <span
                  key={value}
                  onClick={() => setEditTutorType(value)}
                  className={`cursor-pointer rounded-full border-[1.4px] px-4.5 py-2.5 text-sm font-medium transition-colors ${
                    editTutorType === value
                      ? 'border-blue-deep bg-blue-deep text-cream'
                      : 'border-line bg-white text-ink-soft hover:border-blue-deep hover:text-blue-deep'
                  }`}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          {saveError && <p className="mb-4 text-sm text-terracotta">{saveError}</p>}

          <div className="flex justify-end gap-2.5">
            <Button type="button" variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
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
    </Container>
  )
}

export default Profile
