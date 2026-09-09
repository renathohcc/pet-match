import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from './Button'
import RatingBadge from './RatingBadge'
import { getUserRatingSummary } from '../lib/reviews'

const STATUS_LABEL = {
  pendente: 'Pendente',
  aceito: 'Aceito',
  recusado: 'Recusado',
}

const STATUS_CLASS = {
  pendente: 'bg-[#FCF0E4] text-terracotta',
  aceito: 'bg-[#E7F1EA] text-green',
  recusado: 'bg-[#EAEAEA] text-ink-soft',
}

/**
 * Painel "Pedidos de interesse" — visível só pro doador, na página do pet.
 * Lista quem manifestou interesse (qualquer status) com nota/perfil, pra ele
 * decidir quem aceitar antes de liberar o contato (ver petContacts.js).
 */
function InterestsPanel({ interests, loading, onAccept, onDecline, updatingUid }) {
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
    <div className="mb-4.5 rounded-2xl border border-line bg-white p-5.5">
      <h4 className="mb-3 text-[14.5px] font-bold text-blue-deep">
        🐾 Pedidos de interesse ({interests.length})
      </h4>
      <div className="flex flex-col gap-2.5">
        {interests.map((i) => (
          <div key={i.userId} className="rounded-xl border border-line p-3.5">
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
                {STATUS_LABEL[i.status]}
              </span>
            </div>

            {i.message && <p className="mt-2.5 text-[13.5px] italic text-ink-soft">"{i.message}"</p>}

            <div className="mt-3 flex gap-2">
              <Button
                variant="primary"
                className="flex-1"
                disabled={i.status === 'aceito' || updatingUid === i.userId}
                onClick={() => onAccept(i.userId)}
              >
                Aceitar
              </Button>
              <Button
                variant="ghost"
                className="flex-1"
                disabled={i.status === 'recusado' || updatingUid === i.userId}
                onClick={() => onDecline(i.userId)}
              >
                Recusar
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default InterestsPanel
