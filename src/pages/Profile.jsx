import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import Container from '../components/Container'
import { GridPetCard } from '../components/PetCard'
import { listMyPets, PET_STATUSES } from '../lib/pets'
import { useAuth } from '../context/useAuth'

function Profile() {
  const { user } = useAuth()
  const [pets, setPets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- feedback imediato de loading
    setLoading(true)
    setError(null)

    listMyPets(user.uid)
      .then((result) => {
        if (!cancelled) setPets(result)
      })
      .catch(() => {
        if (!cancelled) setError('Não foi possível carregar seus pets agora. Tente novamente em instantes.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user.uid])

  return (
    <Container>
      <Helmet>
        <title>Meu perfil — PetMatch</title>
      </Helmet>

      <div className="flex items-center gap-4 pb-2 pt-9">
        {user.photoURL && (
          <img src={user.photoURL} alt={user.displayName ?? 'Você'} className="h-16 w-16 rounded-full" />
        )}
        <div>
          <h1 className="font-display text-[28px] text-blue-deep">{user.displayName ?? 'Seu perfil'}</h1>
          <p className="text-[14.5px] text-ink-soft">{user.email}</p>
        </div>
      </div>

      <section className="py-10">
        <h2 className="mb-6 font-display text-[22px] text-blue-deep">Meus pets cadastrados</h2>

        {loading && <p className="text-ink-soft">Carregando...</p>}
        {error && <p className="text-terracotta">{error}</p>}

        {!loading && !error && pets.length === 0 && (
          <p className="text-ink-soft">Você ainda não cadastrou nenhum pet.</p>
        )}

        {!loading && !error && pets.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pets.map((pet) => (
              <GridPetCard key={pet.id} pet={pet} statusLabel={PET_STATUSES[pet.status] ?? pet.status} />
            ))}
          </div>
        )}
      </section>
    </Container>
  )
}

export default Profile
