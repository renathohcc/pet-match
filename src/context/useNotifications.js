import { useContext } from 'react'
import { NotificationsContext } from './notificationsContext'

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (!context) throw new Error('useNotifications precisa estar dentro de um NotificationsProvider')
  return context
}
