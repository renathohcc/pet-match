import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import Container from '../components/Container'
import Button from '../components/Button'
import StatusBadge from '../components/StatusBadge'
import ConfirmDialog from '../components/ConfirmDialog'
import { deletePet, getPetById, PET_STATUSES, updatePetStatus } from '../lib/pets'
import { useAuth } from '../context/useAuth'
import { useFavorites } from '../context/useFavorites'

function PetDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, loginWithGoogle } = useAuth()
  const { favoriteIds, toggleFavorite } = useFavorites()
  const [pet, setPet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null) // { type: 'status' | 'delete', value? }

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- feedback imediato de loading ao trocar de pet
    setLoading(true)
    setError(null)

    getPetById(id)
      .then((result) => {
        if (!cancelled) setPet(result)
      })
      .catch(() => {
        if (!cancelled) setError('Não foi possível carregar esse pet agora. Tente novamente em instantes.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return (
      <Container>
        <div className="py-16 text-center text-ink-soft">Carregando...</div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container>
        <div className="py-16 text-center text-terracotta">{error}</div>
      </Container>
    )
  }

  if (!pet) {
    return (
      <Container>
        <div className="py-16 text-center text-ink-soft">
          Pet não encontrado. <Link to="/buscar" className="text-blue-mid">Voltar para a busca</Link>
        </div>
      </Container>
    )
  }

  // Concordância de gênero segue o sexo do pet (Mel é "da Mel", Thor é "do Thor"),
  // não a espécie — "gato" é palavra masculina mas pode ser uma gata fêmea.
  const article = pet.sex === 'Macho' ? 'do' : 'da'

  const whatsappDigits = pet.whatsapp?.replace(/\D/g, '')
  const whatsappNumber = whatsappDigits
    ? whatsappDigits.length <= 11
      ? `55${whatsappDigits}` // assume DDD sem código do país (BR)
      : whatsappDigits
    : ''
  const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    `Olá! Vi o anúncio do(a) ${pet.name} no PetMatch e tenho interesse em adotar.`
  )}`

  const isOwner = user?.uid === pet.donorId
  const isFavorite = favoriteIds.includes(pet.id)

  function handleFavoriteClick() {
    if (!user) {
      loginWithGoogle()
      return
    }
    toggleFavorite(pet.id)
  }

  async function handleStatusChange(status) {
    setUpdatingStatus(true)
    try {
      await updatePetStatus(pet.id, status)
      setPet((prev) => ({ ...prev, status }))
    } finally {
      setUpdatingStatus(false)
      setConfirmAction(null)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deletePet(pet.id)
      navigate('/buscar')
    } finally {
      setDeleting(false)
      setConfirmAction(null)
    }
  }

  const pageTitle = `${pet.name} — ${pet.species === 'cão' ? 'Cão' : 'Gato'} para adoção em ${pet.city} · PetMatch`
  const pageDescription = pet.story || `${pet.name} está esperando por um lar em ${pet.city}. Adoção responsável, sem intermediários.`
  const pageUrl = typeof window !== 'undefined' ? window.location.href : ''

  return (
    <Container>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        {pet.image && <meta property="og:image" content={pet.image} />}
        {pageUrl && <meta property="og:url" content={pageUrl} />}
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <div className="pt-5.5 text-[13.5px] text-ink-soft">
        <Link to="/buscar" className="text-blue-mid">Encontrar um pet</Link> / {pet.city} / {pet.name}
      </div>

      <div className="grid grid-cols-1 items-start gap-12 py-6 pb-17.5 md:grid-cols-[1.3fr_0.9fr]">
        <div>
          <div className="grid grid-cols-[2fr_1fr] gap-2.5">
            <div className="row-span-2 aspect-[1/1.05] overflow-hidden rounded-2xl">
              <img src={pet.image} alt={pet.name} className="h-full w-full object-cover" />
            </div>
            {(pet.thumbs ?? []).map((thumb) => (
              <div key={thumb} className="aspect-square overflow-hidden rounded-xl">
                <img src={thumb} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>

          <div className="mt-6.5 flex items-start justify-between">
            <div>
              <h1 className="font-display text-[36px] text-blue-deep">{pet.name}</h1>
              <div className="mt-2 text-[15px] text-ink-soft">
                📍 {[pet.neighborhood, pet.city].filter(Boolean).join(', ')}{pet.postedAgo ? ` · ${pet.postedAgo}` : ''}
              </div>
            </div>
            <StatusBadge status={pet.status} />
          </div>

          <div className="mt-5.5 flex flex-wrap gap-2.5">
            {[
              ['Sexo', pet.sex],
              ['Idade', pet.age],
              ['Porte', pet.size],
              ['Raça', pet.breed],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[10px] border border-line bg-white px-4 py-2.5 text-[13.5px] text-ink-soft">
                <strong className="block text-[14.5px] text-ink">{value}</strong>
                {label}
              </div>
            ))}
          </div>

          <div className="mt-8.5">
            <h3 className="mb-2.5 text-[19px] text-blue-deep">A história {article} {pet.name}</h3>
            <p className="max-w-[560px] text-[15.5px] text-ink-soft">{pet.story}</p>
          </div>

          <div className="mt-7.5">
            <h3 className="mb-3 text-[19px] text-blue-deep">Saúde e cuidados</h3>
            <div className="grid max-w-[420px] grid-cols-1 gap-2.5 sm:grid-cols-2">
              {(pet.health ?? []).map((item) => (
                <div key={item} className="flex items-center gap-2.5 text-[14.5px] text-ink">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green text-xs text-white">✓</span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-7.5">
            <h3 className="mb-3 text-[19px] text-blue-deep">Temperamento</h3>
            <div className="flex flex-wrap gap-2">
              {(pet.temperament ?? []).map((tag) => (
                <span key={tag} className="rounded-full border border-line bg-cream-2 px-3.5 py-1.5 text-[13.5px] font-semibold text-blue-deep">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <aside className="sticky top-6">
          {isOwner && (
            <div className="mb-4.5 rounded-2xl border border-line bg-white p-5.5">
              <h4 className="mb-3 text-[14.5px] font-bold text-blue-deep">Status do anúncio</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(PET_STATUSES).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    disabled={updatingStatus}
                    onClick={() => setConfirmAction({ type: 'status', value })}
                    className={`cursor-pointer rounded-full border-[1.3px] px-3.5 py-[7px] text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                      pet.status === value
                        ? 'border-blue-deep bg-blue-deep text-cream'
                        : 'border-line bg-white text-ink-soft hover:border-blue-deep hover:text-blue-deep'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setConfirmAction({ type: 'delete' })}
                className="mt-5 w-full cursor-pointer border-t border-line pt-4 text-left text-[13px] font-semibold text-terracotta transition-colors hover:text-[#a3532f]"
              >
                🗑 Excluir anúncio
              </button>
            </div>
          )}

          {!isOwner && (
            <div className="rounded-2xl border border-line bg-white p-6.5">
              <div className="text-[12.5px] font-semibold text-ink-soft">Responsável {article === 'do' ? 'pelo' : 'pela'} {pet.name}</div>
              <div className="my-2.5 mb-5 flex items-center gap-3">
                <div className="h-11 w-11 flex-shrink-0 rounded-full bg-blue-mid" />
                <div>
                  <div className="text-[15px] font-bold">{pet.contactName}</div>
                  <div className="text-[13px] text-ink-soft">{pet.contactType}</div>
                </div>
              </div>
              <Button as="a" href={whatsappHref} target="_blank" rel="noreferrer" variant="whatsapp" className="mb-2.5 w-full">
                💬 Conversar no WhatsApp
              </Button>
              <Button variant="ghost" className="mb-2.5 w-full" onClick={handleFavoriteClick}>
                {isFavorite ? '♥ Salvo' : '♡ Salvar'}
              </Button>
              <div className="mt-4 border-t border-line pt-4 text-[12.5px] leading-relaxed text-ink-soft">
                O contato é feito direto com {pet.contactName.split(' ')[0]}. O PetMatch não intermedia a adoção nem
                cobra taxas — desconfie de qualquer cobrança pedida antes do encontro.
              </div>
            </div>
          )}

          <div className="mt-4.5 rounded-2xl border border-line bg-cream-2 p-5.5">
            <h4 className="mb-3 text-[14.5px] font-bold text-blue-deep">Antes de adotar, pense em:</h4>
            <ul className="flex flex-col gap-2 pl-4.5 text-[13.5px] text-ink-soft">
              <li>Você tem espaço e tempo para os passeios diários {article} {pet.name}?</li>
              <li>Todos em casa estão de acordo com a adoção?</li>
              <li>Você está preparado para os custos de veterinário e alimentação?</li>
            </ul>
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmAction?.type === 'status'}
        title="Mudar status do anúncio"
        message={`Marcar ${pet.name} como "${confirmAction?.value ? PET_STATUSES[confirmAction.value] : ''}"?`}
        confirmLabel="Confirmar"
        onConfirm={() => handleStatusChange(confirmAction.value)}
        onCancel={() => setConfirmAction(null)}
      />

      <ConfirmDialog
        open={confirmAction?.type === 'delete'}
        title="Excluir anúncio"
        message={`Tem certeza que deseja excluir o anúncio ${article} ${pet.name}? Essa ação não pode ser desfeita.`}
        confirmLabel={deleting ? 'Excluindo...' : 'Excluir'}
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmAction(null)}
      />
    </Container>
  )
}

export default PetDetail
