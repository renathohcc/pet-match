import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { useFavorites } from '../context/useFavorites'

function locationLine(pet) {
  return [pet.neighborhood, pet.city].filter(Boolean).join(', ')
}

function metaLine(pet) {
  const species = pet.species === 'cão' ? 'Cão' : 'Gata'
  return [species, pet.sex, pet.age, locationLine(pet)].filter(Boolean).join(' · ')
}

export function FeaturePetCard({ pet, className = '' }) {
  return (
    <Link
      to={`/pet/${pet.id}`}
      className={`group relative block overflow-hidden rounded-[14px] bg-neutral-300 text-white ${className}`}
    >
      <img src={pet.image} alt={pet.name} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/0 from-45% to-[rgba(10,20,30,.78)]" />
      {pet.tag && (
        <div className="absolute top-3 right-3 rounded-full bg-white/92 px-2.5 py-1 text-[11px] font-bold text-blue-deep">
          {pet.tag}
        </div>
      )}
      <div className="absolute bottom-3 left-3.5 right-3.5">
        <div className="font-display text-[19px] font-semibold">{pet.name}</div>
        <div className="mt-0.5 text-[12.5px] opacity-90">{metaLine(pet)}</div>
      </div>
    </Link>
  )
}

export function GridPetCard({ pet }) {
  const { user, loginWithGoogle } = useAuth()
  const { favoriteIds, toggleFavorite } = useFavorites()
  const isOwner = user?.uid === pet.donorId
  const isFavorite = favoriteIds.includes(pet.id)

  function handleFavoriteClick(e) {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      loginWithGoogle()
      return
    }
    toggleFavorite(pet.id)
  }

  return (
    <Link to={`/pet/${pet.id}`} className="block overflow-hidden rounded-[14px] border border-line bg-white">
      <div className="relative aspect-[4/3.1] bg-neutral-300">
        <img src={pet.image} alt={pet.name} className="h-full w-full object-cover" />
        {pet.tag && (
          <span className="absolute top-2.5 left-2.5 rounded-full bg-white/94 px-2.5 py-1 text-[11px] font-bold text-blue-deep">
            {pet.tag}
          </span>
        )}
        {!isOwner && (
          <button
            type="button"
            onClick={handleFavoriteClick}
            aria-label={isFavorite ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
            className={`absolute top-2.5 right-2.5 flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-full bg-white/90 text-sm transition-colors hover:bg-white ${
              isFavorite ? 'text-terracotta' : ''
            }`}
          >
            {isFavorite ? '♥' : '♡'}
          </button>
        )}
      </div>
      <div className="px-4 pt-4 pb-4.5">
        <div className="font-display text-[19px] font-semibold text-blue-deep">{pet.name}</div>
        <div className="mt-1 text-[13.5px] text-ink-soft">
          {pet.sex} · {pet.age} · {pet.temperament?.[0]}
        </div>
        <div className="mt-2.5 flex items-center gap-1 text-[13px] text-ink-soft">📍 {locationLine(pet)}</div>
      </div>
    </Link>
  )
}
