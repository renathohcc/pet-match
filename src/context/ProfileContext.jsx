import { useEffect, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
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
        // Usuário sem esse campo é de antes do onboarding existir — não faz
        // sentido forçar quem já usa o site a passar por ele retroativamente.
        onboarded: data.onboarded ?? true,
      })

      // Primeiro login: ainda não existe doc em users/{uid}, então nome/foto
      // do Google nunca ficam salvos — outras pessoas (ex: listInterestedUsers,
      // getPublicProfile) não conseguem ler isso, só o próprio dono via
      // fallback local. Persiste os dados básicos uma vez pra resolver isso.
      if (!snapshot.exists()) {
        setDoc(
          ref,
          {
            displayName: user.displayName ?? '',
            photoURL: user.photoURL ?? '',
            tutorType: 'independente',
            onboarded: false,
          },
          { merge: true }
        ).catch(() => {})
      }
    })

    return unsubscribe
  }, [user])

  return <ProfileContext.Provider value={{ profile }}>{children}</ProfileContext.Provider>
}
