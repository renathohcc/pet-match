import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from './Button'
import RatingBadge from './RatingBadge'
import { getUserRatingSummary } from '../lib/reviews'

const STATUS_LABEL = {
  pendente: 'Pendente',
  aceito: 'Aceito',
  recusado: 'Recusado',
  confirmacao_pendente: 'Aguardando confirmação',
  confirmado: 'Confirmado',
}

const STATUS_CLASS = {
  pendente: 'bg-[#FCF0E4] text-terracotta',
  aceito: 'bg-[#E7F1EA] text-green',
  recusado: 'bg-[#EAEAEA] text-ink-soft',
  confirmacao_pendente: 'bg-[#E7F1EA] text-green',
  confirmado: 'bg-[#E7F1EA] text-green',
}

/**
 * Linhas de pedido de interesse — visão do doador ("Pedidos que recebi"),
 * usado tanto no teaser de PetDetail.jsx (via contagem) quanto na página
 * /pedidos (lista completa, com nome do pet). Cada status expõe só as ações
 * que fazem sentido dali — nunca "Aceitar"/"Recusar" juntos pra algo já
 * decidido — e toda ação passa por confirmação (o `on*` aqui só ABRE o
 * confirm dialog do chamador; a mutação de verdade roda no onConfirm dele).
 */
function InterestsPanel({ interests, loading, onAccept, onDecline, onMarkAdopter, onCancelConfirmRequest, onReconsider, updatingUid, showPetName = false }) {
  const [ratings, setRatings] = useState({})

  useEffect(() => {
    if (interests.length === 0) return undefined
    let cancelled = false

    Promise.all(interests.map(async (i) => [i.userId, await getUserRatingSummary(i.userId)])).then((entries) => {
      if (!cancelled) setRatings(Object.fromEntries(entries))
    })

    return () => {
      cancelled = true
    }
  }, [interests])

  if (loading) return null
  if (interests.length === 0) return null

  return (
    <div className="flex flex-col gap-2.5">
      {interests.map((i) => {
        const updating = updatingUid === i.userId
        return (
          <div key={`${i.petId}_${i.userId}`} className="rounded-xl border border-line p-3.5">
            {showPetName && (
              <Link to={`/pet/${i.petId}`} className="mb-2 block text-[12.5px] font-semibold text-blue-mid hover:underline">
                🐾 {i.petName}
              </Link>
            )}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                {i.photoURL ? (
                  <img src={i.photoURL} alt="" className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-mid text-sm font-semibold text-white">
                    {(i.displayName || 'U')[0]}
                  </span>
                )}
                <div>
                  <Link to={`/usuario/${i.userId}`} className="text-[14px] font-semibold text-ink hover:text-blue-deep hover:underline">
                    {i.displayName}
                  </Link>
                  {ratings[i.userId] && <RatingBadge average={ratings[i.userId].average} count={ratings[i.userId].count} />}
                </div>
              </div>
              <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_CLASS[i.status]}`}>
                {STATUS_LABEL[i.status] ?? i.status}
              </span>
            </div>

            {i.message && <p className="mt-2.5 text-[13.5px] italic text-ink-soft">"{i.message}"</p>}

            {i.status === 'pendente' && (
              <div className="mt-3 flex gap-2">
                <Button variant="primary" className="flex-1" disabled={updating} onClick={() => onAccept(i)}>
                  Aceitar
                </Button>
                <Button variant="ghost" className="flex-1" disabled={updating} onClick={() => onDecline(i)}>
                  Recusar
                </Button>
              </div>
            )}

            {i.status === 'aceito' && (
              <div className="mt-3 flex gap-2">
                <Button variant="primary" className="flex-1" disabled={updating} onClick={() => onMarkAdopter(i)}>
                  Marcar como adotante
                </Button>
                <Button variant="ghost" className="flex-1" disabled={updating} onClick={() => onDecline(i)}>
                  Recusar
                </Button>
              </div>
            )}

            {i.status === 'recusado' && (
              <div className="mt-3">
                <Button variant="ghost" className="w-full" disabled={updating} onClick={() => onReconsider(i)}>
                  Reconsiderar
                </Button>
              </div>
            )}

            {i.status === 'confirmacao_pendente' && (
              <div className="mt-3">
                <p className="mb-2 text-[12.5px] text-ink-soft">⏳ Aguardando confirmação da pessoa escolhida.</p>
                <Button variant="ghost" className="w-full" disabled={updating} onClick={() => onCancelConfirmRequest(i)}>
                  Cancelar pedido
                </Button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default InterestsPanel
