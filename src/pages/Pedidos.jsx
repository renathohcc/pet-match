import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useNavigate } from 'react-router-dom'
import Container from '../components/Container'
import Button from '../components/Button'
import ConfirmDialog from '../components/ConfirmDialog'
import InterestsPanel from '../components/InterestsPanel'
import { useAuth } from '../context/useAuth'
import { useProfile } from '../context/useProfile'
import { listMyInterests, listReceivedInterests, updateInterestStatus } from '../lib/interests'
import { updatePetStatus } from '../lib/pets'
import {
  createAdoptionConfirmRequestNotification,
  createAdoptionConfirmedNotification,
  createInterestAcceptedNotification,
  createReviewReminder,
  deleteAdoptionConfirmRequestNotification,
  deleteInterestRequestNotification,
} from '../lib/notifications'

const MY_STATUS_LABEL = {
  pendente: '⏳ Aguardando resposta do doador',
  aceito: '✅ Aceito — você já pode conversar',
  recusado: '❌ Esse doador não seguiu com seu pedido',
  confirmacao_pendente: '',
  confirmado: '🏡 Adoção confirmada!',
}

function Pedidos() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const navigate = useNavigate()

  const [received, setReceived] = useState([])
  const [receivedLoading, setReceivedLoading] = useState(true)
  const [mine, setMine] = useState([])
  const [mineLoading, setMineLoading] = useState(true)
  const [updatingUid, setUpdatingUid] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null) // { type, interest } | null

  function loadReceived() {
    setReceivedLoading(true)
    listReceivedInterests(user.uid)
      .then(setReceived)
      .catch(() => setReceived([]))
      .finally(() => setReceivedLoading(false))
  }

  function loadMine() {
    setMineLoading(true)
    listMyInterests(user.uid)
      .then(setMine)
      .catch(() => setMine([]))
      .finally(() => setMineLoading(false))
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial das listas
    loadReceived()
    loadMine()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- carga inicial, roda só uma vez
  }, [])

  function updateReceivedLocal(interest, status) {
    setReceived((prev) => prev.map((i) => (i.petId === interest.petId && i.userId === interest.userId ? { ...i, status } : i)))
  }

  function updateMineLocal(interest, status) {
    setMine((prev) => prev.map((i) => (i.petId === interest.petId && i.userId === interest.userId ? { ...i, status } : i)))
  }

  async function runReceivedAction(interest, status, sideEffect) {
    setUpdatingUid(interest.userId)
    try {
      await updateInterestStatus(interest.petId, interest.userId, status)
      updateReceivedLocal(interest, status)
      await sideEffect?.().catch?.(() => {})
    } finally {
      setUpdatingUid(null)
      setConfirmAction(null)
    }
  }

  function handleAccept(interest) {
    setConfirmAction({
      type: 'accept',
      interest,
      title: 'Aceitar interesse',
      message: `Aceitar o interesse de ${interest.displayName} em ${interest.petName}? Isso libera seu contato do WhatsApp pra ela(e).`,
      confirmLabel: 'Aceitar',
      onConfirm: () =>
        runReceivedAction(interest, 'aceito', () =>
          Promise.all([
            deleteInterestRequestNotification(interest.petId, interest.userId),
            createInterestAcceptedNotification({ petId: interest.petId, petName: interest.petName, userId: interest.userId }),
          ])
        ),
    })
  }

  function handleDecline(interest) {
    setConfirmAction({
      type: 'decline',
      interest,
      title: 'Recusar interesse',
      message: `Recusar o interesse de ${interest.displayName} em ${interest.petName}?`,
      confirmLabel: 'Recusar',
      danger: true,
      onConfirm: () => runReceivedAction(interest, 'recusado', () => deleteInterestRequestNotification(interest.petId, interest.userId)),
    })
  }

  function handleReconsider(interest) {
    setConfirmAction({
      type: 'reconsider',
      interest,
      title: 'Reconsiderar interesse',
      message: `Voltar o interesse de ${interest.displayName} em ${interest.petName} pra "Aceito"?`,
      confirmLabel: 'Aceitar',
      onConfirm: () =>
        runReceivedAction(interest, 'aceito', () =>
          createInterestAcceptedNotification({ petId: interest.petId, petName: interest.petName, userId: interest.userId })
        ),
    })
  }

  function handleMarkAdopter(interest) {
    setConfirmAction({
      type: 'markAdopter',
      interest,
      title: 'Marcar como adotante',
      message: `Isso envia um pedido de confirmação pra ${interest.displayName} — o anúncio de ${interest.petName} só vira "Adotado" depois que ela(e) confirmar de verdade.`,
      confirmLabel: 'Marcar e pedir confirmação',
      onConfirm: () =>
        runReceivedAction(interest, 'confirmacao_pendente', () =>
          createAdoptionConfirmRequestNotification({ petId: interest.petId, petName: interest.petName, userId: interest.userId })
        ),
    })
  }

  function handleCancelConfirmRequest(interest) {
    setConfirmAction({
      type: 'cancelConfirmRequest',
      interest,
      title: 'Cancelar pedido de confirmação',
      message: `Cancelar o pedido de confirmação enviado pra ${interest.displayName}? O interesse volta pra "Aceito".`,
      confirmLabel: 'Cancelar pedido',
      danger: true,
      onConfirm: () =>
        runReceivedAction(interest, 'aceito', () => deleteAdoptionConfirmRequestNotification(interest.petId, interest.userId)),
    })
  }

  function handleConfirmAdoption(interest) {
    setConfirmAction({
      type: 'confirmAdoption',
      interest,
      title: 'Confirmar adoção',
      message: `Confirma que você realmente adotou ${interest.petName}? Isso marca o anúncio como "Adotado" e libera as avaliações dos dois lados.`,
      confirmLabel: 'Sim, eu adotei',
      onConfirm: async () => {
        setUpdatingUid(interest.userId)
        try {
          await updateInterestStatus(interest.petId, interest.userId, 'confirmado')
          await updatePetStatus(interest.petId, 'adotado', interest.userId)
          updateMineLocal(interest, 'confirmado')
          await Promise.all([
            createReviewReminder({ petId: interest.petId, petName: interest.petName, direction: 'donor_to_adopter', userId: interest.donorId }),
            createReviewReminder({ petId: interest.petId, petName: interest.petName, direction: 'adopter_to_donor', userId: user.uid }),
            createAdoptionConfirmedNotification({
              petId: interest.petId,
              petName: interest.petName,
              userId: interest.donorId,
              fromUserId: user.uid,
              fromUserName: profile?.displayName || user.displayName || 'Alguém',
            }),
            deleteAdoptionConfirmRequestNotification(interest.petId, user.uid),
          ]).catch(() => {})
          // Já emenda pra avaliação — a pessoa acabou de confirmar a adoção,
          // não faz sentido pedir pra ela achar o botão de avaliar depois.
          navigate(`/pet/${interest.petId}?avaliar=adopter_to_donor`)
        } finally {
          setUpdatingUid(null)
          setConfirmAction(null)
        }
      },
    })
  }

  function handleDeclineConfirmation(interest) {
    setConfirmAction({
      type: 'declineConfirmation',
      interest,
      title: 'Ainda não adotei',
      message: `Isso avisa que você ainda não confirma a adoção de ${interest.petName} — o interesse volta pra "Aceito" e o doador pode escolher outra pessoa.`,
      confirmLabel: 'Confirmar',
      danger: true,
      onConfirm: async () => {
        setUpdatingUid(interest.userId)
        try {
          await updateInterestStatus(interest.petId, interest.userId, 'aceito')
          updateMineLocal(interest, 'aceito')
          deleteAdoptionConfirmRequestNotification(interest.petId, user.uid).catch(() => {})
        } finally {
          setUpdatingUid(null)
          setConfirmAction(null)
        }
      },
    })
  }

  return (
    <Container>
      <Helmet>
        <title>Meus pedidos — PetMatch</title>
      </Helmet>

      <div className="pb-2 pt-9">
        <h1 className="font-display text-[28px] text-blue-deep">Meus pedidos</h1>
        <p className="mt-1.5 text-[14.5px] text-ink-soft">
          Todos os pedidos de interesse e confirmações de adoção, dos seus anúncios e dos pets que você se interessou, num lugar só.
        </p>
      </div>

      <section className="py-7.5">
        <h2 className="mb-4 font-display text-[20px] text-blue-deep">Pedidos que recebi</h2>
        {receivedLoading && <p className="text-ink-soft">Carregando...</p>}
        {!receivedLoading && received.length === 0 && <p className="text-ink-soft">Nenhum pedido de interesse ainda.</p>}
        {!receivedLoading && received.length > 0 && (
          <InterestsPanel
            interests={received}
            loading={false}
            showPetName
            updatingUid={updatingUid}
            onAccept={handleAccept}
            onDecline={handleDecline}
            onReconsider={handleReconsider}
            onMarkAdopter={handleMarkAdopter}
            onCancelConfirmRequest={handleCancelConfirmRequest}
          />
        )}
      </section>

      <section className="pb-16">
        <h2 className="mb-4 font-display text-[20px] text-blue-deep">Meus pedidos</h2>
        {mineLoading && <p className="text-ink-soft">Carregando...</p>}
        {!mineLoading && mine.length === 0 && <p className="text-ink-soft">Você ainda não manifestou interesse em nenhum pet.</p>}
        {!mineLoading && mine.length > 0 && (
          <div className="flex flex-col gap-2.5">
            {mine.map((i) => (
              <div key={`${i.petId}_${i.userId}`} className="rounded-xl border border-line bg-white p-3.5">
                <Link to={`/pet/${i.petId}`} className="mb-2 block text-[12.5px] font-semibold text-blue-mid hover:underline">
                  🐾 {i.petName}
                </Link>

                {i.status === 'confirmacao_pendente' ? (
                  <div className="rounded-lg bg-cream-2 p-3">
                    <p className="mb-3 text-[13.5px] text-ink">🎉 Você foi escolhido(a) como adotante! Confirma que adotou de verdade?</p>
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        className="flex-1"
                        disabled={updatingUid === i.userId}
                        onClick={() => handleConfirmAdoption(i)}
                      >
                        Sim, eu adotei
                      </Button>
                      <Button
                        variant="ghost"
                        className="flex-1"
                        disabled={updatingUid === i.userId}
                        onClick={() => handleDeclineConfirmation(i)}
                      >
                        Ainda não
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-[13.5px] text-ink-soft">{MY_STATUS_LABEL[i.status] ?? i.status}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={confirmAction?.title}
        message={confirmAction?.message}
        confirmLabel={confirmAction?.confirmLabel}
        danger={confirmAction?.danger}
        onConfirm={confirmAction?.onConfirm}
        onCancel={() => setConfirmAction(null)}
      />
    </Container>
  )
}

export default Pedidos
