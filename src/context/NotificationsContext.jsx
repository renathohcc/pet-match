import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from './useAuth'
import { NotificationsContext } from './notificationsContext'

export function NotificationsProvider({ children }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- limpa notificações ao deslogar
      setNotifications([])
      return undefined
    }

    const q = query(collection(db, 'notifications'), where('userId', '==', user.uid))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      // Ordena no client — evita precisar de índice composto (userId + createdAt)
      // pra um volume de dados pequeno (poucos lembretes pendentes por usuário).
      list.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
      setNotifications(list)
    })

    return unsubscribe
  }, [user])

  return <NotificationsContext.Provider value={{ notifications }}>{children}</NotificationsContext.Provider>
}
