import { useEffect, useState } from 'react'
import { arrayRemove, arrayUnion, doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from './useAuth'
import { FavoritesContext } from './favoritesContext'

export function FavoritesProvider({ children }) {
  const { user } = useAuth()
  const [favoriteIds, setFavoriteIds] = useState([])

  useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- limpa favoritos ao deslogar
      setFavoriteIds([])
      return undefined
    }

    const ref = doc(db, 'users', user.uid)
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      setFavoriteIds(snapshot.data()?.favoritePetIds ?? [])
    })

    return unsubscribe
  }, [user])

  async function toggleFavorite(petId) {
    if (!user) return
    const ref = doc(db, 'users', user.uid)
    const isFavorite = favoriteIds.includes(petId)
    await setDoc(ref, { favoritePetIds: isFavorite ? arrayRemove(petId) : arrayUnion(petId) }, { merge: true })
  }

  return (
    <FavoritesContext.Provider value={{ favoriteIds, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  )
}
