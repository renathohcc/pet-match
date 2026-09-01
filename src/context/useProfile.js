import { useContext } from 'react'
import { ProfileContext } from './profileContext'

export function useProfile() {
  const context = useContext(ProfileContext)
  if (!context) throw new Error('useProfile precisa estar dentro de um ProfileProvider')
  return context
}
