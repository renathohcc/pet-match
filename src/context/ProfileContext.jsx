import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from './useAuth'
import { ProfileContext } from './profileContext'

export function ProfileProvider({ children }) {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    if (!user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- limpa perfil ao deslogar
      setProfile(null)
      return undefined
    }

    const ref = doc(db, 'users', user.uid)
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const data = snapshot.data() ?? {}
      setProfile({
        displayName: data.displayName ?? user.displayName ?? '',
        photoURL: data.photoURL ?? user.photoURL ?? '',
        tutorType: data.tutorType ?? 'independente',
      })
    })

    return unsubscribe
  }, [user])

  return <ProfileContext.Provider value={{ profile }}>{children}</ProfileContext.Provider>
}
