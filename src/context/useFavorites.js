import { useContext } from 'react'
import { FavoritesContext } from './favoritesContext'

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (!context) throw new Error('useFavorites precisa estar dentro de um FavoritesProvider')
  return context
}
