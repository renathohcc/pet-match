import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import Container from '../components/Container'
import Button from '../components/Button'
import StatusBadge from '../components/StatusBadge'
import Chip from '../components/Chip'
import ConfirmDialog from '../components/ConfirmDialog'
import Modal from '../components/Modal'
import ShareCard from '../components/ShareCard'
import InterestRequestDialog from '../components/InterestRequestDialog'
import ReviewDialog from '../components/ReviewDialog'
import RatingBadge from '../components/RatingBadge'
import { deletePet, getPetById, PET_STATUSES, updatePetStatus } from '../lib/pets'
import { useAuth } from '../context/useAuth'
import { useProfile } from '../context/useProfile'
import { useFavorites } from '../context/useFavorites'
import { getMyInterest, listInterests, requestInterest } from '../lib/interests'
import { getPetContact } from '../lib/petContacts'
import { getReview, getUserRatingSummary, submitReview } from '../lib/reviews'
import { createInterestRequestNotification, deleteReviewReminder } from '../lib/notifications'
import { getPublicProfile } from '../lib/users'
import { isAdmin } from '../lib/admin'

function PetDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const { profile } = useProfile()
  const { favoriteIds, toggleFavorite } = useFavorites()
  const [pet, setPet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null) // { type: 'status' | 'delete', value? }
  const [shareOpen, setShareOpen] = useState(false)
  const [shareContact, setShareContact] = useState(null) // whatsapp do próprio doador, carregado só ao abrir compartilhar

  // Manifestação de interesse (visão de quem não é dono do pet)
  const [myInterest, setMyInterest] = useState(null) // { status, message } | null
  const [myInterestLoaded, setMyInterestLoaded] = useState(false)
  const [interestRequestOpen, setInterestRequestOpen] = useState(false)
  const [contactWhatsapp, setContactWhatsapp] = useState(null) // liberado só depois do interesse aceito

  // Contagem de "Pedidos de interesse" (visão do dono do pet) — só um teaser
  // aqui; a gestão de verdade (aceitar/recusar/marcar adotante) vive em /pedidos.
  const [interestsCount, setInterestsCount] = useState(0)
  const [interestsLoading, setInterestsLoading] = useState(true)
  const [donorRating, setDonorRating] = useState({ average: 0, count: 0 })
  const [donorRatingLoading, setDonorRatingLoading] = useState(true)
  const [adopterName, setAdopterName] = useState('')
  const [reviewTarget, setReviewTarget] = useState(null) // { uid, name, direction } | null
  const [myReviews, setMyReviews] = useState({ donor_to_adopter: null, adopter_to_donor: null })
  // Só sabemos se "pode avaliar" depois que myReviews carrega — sem isso o
  // botão "⭐ Avaliar" pisca aparecendo e sumindo pra quem já avaliou.
  const [myReviewsLoaded, setMyReviewsLoaded] = useState(false)

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

  useEffect(() => {
    if (!pet) return undefined
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- feedback imediato de loading da nota do doador
    setDonorRatingLoading(true)

    getUserRatingSummary(pet.donorId).then((summary) => {
      if (!cancelled) {
        setDonorRating(summary)
        setDonorRatingLoading(false)
      }
    })

    // Perfil do adotante só é lido se tiver alguém logado (a rule de `users`
    // exige isSignedIn() — visitante anônimo nem pode ler, e nem precisa,
    // já que o nome só aparece no botão de avaliar, visível pro dono logado).
    if (pet.adopterId && user) {
      getPublicProfile(pet.adopterId)
        .then((profile) => {
          if (!cancelled) setAdopterName(profile.displayName)
        })
        .catch(() => {})
    }

    if (pet.status === 'adotado' && pet.adopterId && user) {
      setMyReviewsLoaded(false)
      Promise.all([getReview(pet.id, 'donor_to_adopter'), getReview(pet.id, 'adopter_to_donor')]).then(
        ([donorToAdopter, adopterToDonor]) => {
          if (!cancelled) {
            setMyReviews({ donor_to_adopter: donorToAdopter, adopter_to_donor: adopterToDonor })
            setMyReviewsLoaded(true)
          }
        }
      )
    } else {
      setMyReviewsLoaded(true)
    }

    return () => {
      cancelled = true
    }
  }, [pet, user])

  // Owner compartilhando o próprio pet: busca o contato só nesse momento
  // (lazy) pra manter a opção "mostrar meu contato" do ShareCard funcionando
  // mesmo com o whatsapp fora do doc público do pet.
  useEffect(() => {
    if (!shareOpen || !pet || user?.uid !== pet.donorId || shareContact) return
    getPetContact(pet.id).then(setShareContact).catch(() => {})
  }, [shareOpen, pet, user, shareContact])

  // Manifestação de interesse do próprio usuário logado (visão de quem não é dono).
  useEffect(() => {
    if (!pet || !user || user.uid === pet.donorId) return undefined
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- feedback imediato de loading
    setMyInterestLoaded(false)

    getMyInterest(pet.id, user.uid)
      .then((interest) => {
        if (!cancelled) setMyInterest(interest)
      })
      .catch(() => {
        // Sem permissão/erro de rede: trata como "nunca manifestou interesse"
        // em vez de travar em "Carregando..." pra sempre.
        if (!cancelled) setMyInterest(null)
      })
      .finally(() => {
        if (!cancelled) setMyInterestLoaded(true)
      })

    return () => {
      cancelled = true
    }
  }, [pet, user])

  // Contagem de pedidos de interesse (visão do dono do pet) — só pro teaser
  // que linka pra /pedidos, onde a gestão de verdade acontece.
  useEffect(() => {
    if (!pet || !user || user.uid !== pet.donorId) return undefined
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- feedback imediato de loading
    setInterestsLoading(true)

    listInterests(pet.id, pet.donorId)
      .then((list) => {
        if (!cancelled) setInterestsCount(list.length)
      })
      .catch(() => {
        if (!cancelled) setInterestsCount(0)
      })
      .finally(() => {
        if (!cancelled) setInterestsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [pet, user])

  // Deep link vindo do sino de notificação (/pet/:id?avaliar=donor_to_adopter):
  // abre o diálogo de avaliação direto, sem precisar achar o card manualmente.
  useEffect(() => {
    if (!pet || !myReviewsLoaded || reviewTarget) return
    const direction = searchParams.get('avaliar')
    if (direction !== 'donor_to_adopter' && direction !== 'adopter_to_donor') return

    const isOwner = user?.uid === pet.donorId
    const isAdopter = Boolean(user) && user.uid === pet.adopterId
    const canOpen =
      (direction === 'donor_to_adopter' && isOwner && pet.adopterId && !myReviews.donor_to_adopter) ||
      (direction === 'adopter_to_donor' && isAdopter && !myReviews.adopter_to_donor)

    if (canOpen) openReviewDialog(direction)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- openReviewDialog é redeclarada a cada render mas é estável o suficiente aqui
  }, [pet, user, myReviewsLoaded, myReviews, searchParams, reviewTarget])

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

  function buildWhatsappHref(whatsapp) {
    const digits = whatsapp?.replace(/\D/g, '')
    const number = digits ? (digits.length <= 11 ? `55${digits}` : digits) : '' // assume DDD sem código do país (BR)
    return `https://wa.me/${number}?text=${encodeURIComponent(
      `Olá! Vi o anúncio do(a) ${pet.name} no Adota.THE e tenho interesse em adotar.`
    )}`
  }

  const isOwner = user?.uid === pet.donorId
  const isAdopter = Boolean(user) && user.uid === pet.adopterId
  const isFavorite = favoriteIds.includes(pet.id)

  const canReviewAdopter =
    isOwner && pet.status === 'adotado' && pet.adopterId && myReviewsLoaded && !myReviews.donor_to_adopter
  const canReviewDonor = isAdopter && pet.status === 'adotado' && myReviewsLoaded && !myReviews.adopter_to_donor

  function handleFavoriteClick() {
    if (!user) {
      navigate(`/entrar?redirectTo=${encodeURIComponent(`/pet/${id}`)}`)
      return
    }
    toggleFavorite(pet.id)
  }

  async function handleContactButtonClick() {
    if (!user) {
      navigate(`/entrar?redirectTo=${encodeURIComponent(`/pet/${id}`)}`)
      return
    }
    if (!myInterest) {
      setInterestRequestOpen(true)
      return
    }
    if (myInterest.status === 'aceito') {
      let whatsapp = contactWhatsapp
      if (!whatsapp) {
        try {
          const contact = await getPetContact(pet.id)
          whatsapp = contact?.whatsapp
          setContactWhatsapp(whatsapp)
        } catch {
          alert('Não foi possível carregar o contato agora. Tente novamente em instantes.')
          return
        }
      }
      window.open(buildWhatsappHref(whatsapp), '_blank', 'noopener')
    }
    // pendente/recusado: botão fica desabilitado/informativo, sem ação de clique.
  }

  async function handleInterestRequestSubmit(message) {
    await requestInterest({ petId: pet.id, petName: pet.name, donorId: pet.donorId, userId: user.uid, message })
    createInterestRequestNotification({
      petId: pet.id,
      petName: pet.name,
      donorId: pet.donorId,
      fromUserId: user.uid,
      fromUserName: profile?.displayName || user.displayName || 'Alguém',
    }).catch(() => {})
    setMyInterest({ status: 'pendente', message })
    setInterestRequestOpen(false)
  }

  // Marcar "Adotado" na mão continua existindo pro caso de adoção fora da
  // plataforma (sem interesse rastreado) — quando já há pedidos aceitos ou
  // aguardando confirmação, o aviso no diálogo sugere usar "Marcar como
  // adotante" em /pedidos em vez disso, que é o caminho com confirmação da
  // outra pessoa (ver Fase 10 do plano).
  function handleStatusChipClick(value) {
    setConfirmAction({ type: 'status', value })
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

  function openReviewDialog(direction) {
    if (direction === 'donor_to_adopter') {
      setReviewTarget({ uid: pet.adopterId, name: adopterName || 'quem adotou', direction })
    } else {
      setReviewTarget({ uid: pet.donorId, name: pet.contactName, direction })
    }
  }

  async function handleReviewSubmit({ rating, comment, survey }) {
    await submitReview({
      petId: pet.id,
      fromUserId: user.uid,
      toUserId: reviewTarget.uid,
      direction: reviewTarget.direction,
      rating,
      comment,
      survey,
    })
    // A avaliação foi feita — o lembrete não tem mais razão de existir.
    deleteReviewReminder(pet.id, reviewTarget.direction).catch(() => {})
    setMyReviews((prev) => ({ ...prev, [reviewTarget.direction]: { rating, comment, survey } }))
    if (reviewTarget.direction === 'adopter_to_donor') {
      getUserRatingSummary(pet.donorId).then(setDonorRating)
    }
    setReviewTarget(null)
  }

  const pageTitle = `${pet.name} — ${pet.species === 'cão' ? 'Cão' : 'Gato'} para adoção em ${pet.city} · Adota.THE`
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

        <aside className="md:sticky md:top-6">
          <Button variant="ghost" className="mb-4.5 w-full" onClick={() => setShareOpen(true)}>
            📤 Compartilhar {pet.name}
          </Button>

          {(canReviewAdopter || canReviewDonor) && (
            <div className="mb-4.5 rounded-2xl border border-line bg-cream-2 p-5.5 text-center">
              <p className="mb-3 text-[13.5px] text-ink-soft">
                {pet.name} foi adotad{article === 'do' ? 'o' : 'a'}! Conta como foi a experiência:
              </p>
              <Button
                variant="terracotta"
                className="w-full"
                onClick={() => openReviewDialog(canReviewAdopter ? 'donor_to_adopter' : 'adopter_to_donor')}
              >
                ⭐ Avaliar {canReviewAdopter ? adopterName || 'quem adotou' : pet.contactName}
              </Button>
            </div>
          )}

          {isOwner && pet.status !== 'adotado' && !interestsLoading && interestsCount > 0 && (
            <Link
              to="/pedidos"
              className="mb-4.5 block rounded-2xl border border-line bg-white p-4.5 text-[13.5px] font-semibold text-blue-deep hover:border-blue-deep"
            >
              🐾 {interestsCount} pedido{interestsCount > 1 ? 's' : ''} de interesse — Ver em Meus Pedidos →
            </Link>
          )}

          {isOwner && (
            <div className="mb-4.5 rounded-2xl border border-line bg-white p-5.5">
              <h4 className="mb-3 text-[14.5px] font-bold text-blue-deep">Status do anúncio</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(PET_STATUSES).map(([value, label]) => (
                  <Chip
                    key={value}
                    disabled={updatingStatus}
                    active={pet.status === value}
                    onClick={() => handleStatusChipClick(value)}
                  >
                    {label}
                  </Chip>
                ))}
              </div>

              {pet.status === 'adotado' && !isAdmin(user?.uid) ? (
                <p className="mt-5 border-t border-line pt-4 text-[12.5px] text-ink-soft">
                  Pets adotados não podem mais ser excluídos, pra preservar o histórico de avaliações.
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmAction({ type: 'delete' })}
                  className="mt-5 w-full cursor-pointer border-t border-line pt-4 text-left text-[13px] font-semibold text-terracotta transition-colors hover:text-[#a3532f]"
                >
                  🗑 Excluir anúncio
                </button>
              )}
            </div>
          )}

          {!isOwner && (
            <div className="rounded-2xl border border-line bg-white p-6.5">
              <div className="text-[12.5px] font-semibold text-ink-soft">Responsável {article === 'do' ? 'pelo' : 'pela'} {pet.name}</div>
              <div className="my-2.5 mb-5 flex items-center gap-3">
                <div className="h-11 w-11 flex-shrink-0 rounded-full bg-blue-mid" />
                <div>
                  <Link to={`/usuario/${pet.donorId}`} className="text-[15px] font-bold text-ink hover:text-blue-deep hover:underline">
                    {pet.contactName}
                  </Link>
                  <div className="text-[13px] text-ink-soft">{pet.contactType}</div>
                  {donorRatingLoading ? (
                    <span className="text-[13px] text-ink-soft">Carregando avaliações...</span>
                  ) : (
                    <RatingBadge average={donorRating.average} count={donorRating.count} />
                  )}
                </div>
              </div>
              {pet.status === 'adotado' ? (
                <p className="mb-2.5 rounded-lg bg-cream-2 px-3.5 py-2.5 text-center text-[13.5px] text-ink-soft">
                  Esse pet já foi adotado.
                </p>
              ) : !user ? (
                <Button variant="whatsapp" className="mb-2.5 w-full" onClick={handleContactButtonClick}>
                  🔒 Entrar para ver o contato
                </Button>
              ) : !myInterestLoaded ? (
                <Button variant="whatsapp" className="mb-2.5 w-full" disabled>
                  Carregando...
                </Button>
              ) : !myInterest ? (
                <Button variant="whatsapp" className="mb-2.5 w-full" onClick={handleContactButtonClick}>
                  🐾 Tenho interesse nesse pet
                </Button>
              ) : myInterest.status === 'pendente' ? (
                <Button variant="ghost" className="mb-2.5 w-full" disabled>
                  ⏳ Interesse enviado — aguardando o doador
                </Button>
              ) : myInterest.status === 'aceito' ? (
                <Button variant="whatsapp" className="mb-2.5 w-full" onClick={handleContactButtonClick}>
                  💬 Conversar no WhatsApp
                </Button>
              ) : myInterest.status === 'confirmacao_pendente' ? (
                <Link
                  to="/pedidos"
                  className="mb-2.5 block rounded-lg bg-cream-2 px-3.5 py-2.5 text-center text-[13.5px] font-semibold text-blue-deep hover:underline"
                >
                  🎉 Você foi escolhido(a)! Confirme em Meus Pedidos →
                </Link>
              ) : myInterest.status === 'confirmado' ? (
                <p className="mb-2.5 rounded-lg bg-cream-2 px-3.5 py-2.5 text-center text-[13.5px] text-ink-soft">
                  🏡 Você confirmou a adoção desse pet.
                </p>
              ) : (
                <p className="mb-2.5 rounded-lg bg-cream-2 px-3.5 py-2.5 text-center text-[13.5px] text-ink-soft">
                  Esse doador já seguiu com outro processo pra esse pet.
                </p>
              )}
              <Button variant="ghost" className="mb-2.5 w-full" onClick={handleFavoriteClick}>
                {isFavorite ? '♥ Salvo' : '♡ Salvar'}
              </Button>
              <div className="mt-4 border-t border-line pt-4 text-[12.5px] leading-relaxed text-ink-soft">
                O contato só é liberado depois que {pet.contactName.split(' ')[0]} aceitar seu interesse. O Adota.THE
                não intermedia a adoção nem cobra taxas — desconfie de qualquer cobrança pedida antes do encontro.
                <div className="mt-2">
                  <Link to={`/denunciar?petId=${pet.id}&petName=${encodeURIComponent(pet.name)}`} className="text-terracotta hover:underline">
                    🚩 Denunciar este anúncio
                  </Link>
                </div>
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
        message={
          confirmAction?.value === 'adotado' && interestsCount > 0
            ? `Marcar ${pet.name} como "Adotado" manualmente, sem vincular a um pedido de interesse específico? Se foi alguém que pediu interesse por aqui, prefira "Marcar como adotante" em Meus Pedidos — assim a pessoa confirma antes do anúncio fechar.`
            : `Marcar ${pet.name} como "${confirmAction?.value ? PET_STATUSES[confirmAction.value] : ''}"?`
        }
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

      <InterestRequestDialog
        open={interestRequestOpen}
        petName={pet.name}
        article={article}
        onSubmit={handleInterestRequestSubmit}
        onCancel={() => setInterestRequestOpen(false)}
      />

      <ReviewDialog
        open={Boolean(reviewTarget)}
        targetName={reviewTarget?.name}
        direction={reviewTarget?.direction}
        onSubmit={handleReviewSubmit}
        onCancel={() => setReviewTarget(null)}
      />

      <Modal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        showCloseButton
        overlayClassName="items-start sm:items-center"
        cardClassName="flex max-h-[85vh] w-full max-w-[460px] flex-col rounded-2xl bg-cream shadow-[0_20px_40px_rgba(22,50,79,.2)]"
      >
        <div className="overflow-y-auto overscroll-contain p-6">
          <ShareCard pet={shareContact ? { ...pet, whatsapp: shareContact.whatsapp } : pet} />
        </div>
      </Modal>
    </Container>
  )
}

export default PetDetail
