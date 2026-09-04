import { useEffect, useState } from 'react'
import Button from './Button'
import RatingBadge from './RatingBadge'
import { getUserRatingSummary } from '../lib/reviews'

function AdopterPickerDialog({ open, petName, interestedUsers, onSelect, onCancel }) {
  const [ratings, setRatings] = useState({})

  useEffect(() => {
    if (!open) return
    let cancelled = false

    Promise.all(
      interestedUsers.map(async (u) => [u.uid, await getUserRatingSummary(u.uid)])
    ).then((entries) => {
      if (!cancelled) setRatings(Object.fromEntries(entries))
    })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- interestedUsers é estável enquanto o dialog está aberto
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-[380px] rounded-2xl bg-white p-6.5 shadow-[0_20px_40px_rgba(22,50,79,.2)]">
        <h3 className="mb-2.5 font-display text-lg text-blue-deep">Quem adotou {petName}?</h3>
        <p className="mb-5 text-[14.5px] text-ink-soft">
          Escolha entre quem demonstrou interesse — isso libera a avaliação mútua entre vocês depois.
        </p>

        <div className="mb-5 flex max-h-[320px] flex-col gap-2 overflow-y-auto">
          {interestedUsers.map((u) => (
            <button
              key={u.uid}
              type="button"
              onClick={() => onSelect(u.uid)}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-line px-3.5 py-2.5 text-left transition-colors hover:border-blue-deep hover:bg-cream-2"
            >
              {u.photoURL ? (
                <img src={u.photoURL} alt="" className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-mid text-sm font-semibold text-white">
                  {(u.displayName || 'U')[0]}
                </span>
              )}
              <span>
                <span className="block text-[14.5px] font-semibold text-ink">{u.displayName}</span>
                {ratings[u.uid] && (
                  <RatingBadge average={ratings[u.uid].average} count={ratings[u.uid].count} />
                )}
              </span>
            </button>
          ))}
        </div>

        <div className="flex justify-between gap-2.5">
          <Button variant="ghost" onClick={() => onSelect(null)}>
            Nenhum desses
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  )
}

export default AdopterPickerDialog
