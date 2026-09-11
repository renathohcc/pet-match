import { useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Container from '../components/Container'
import Button from '../components/Button'
import ProfileForm from '../components/ProfileForm'
import { serverTimestamp } from 'firebase/firestore'
import { useAuth } from '../context/useAuth'
import { useProfile } from '../context/useProfile'
import { updateUserProfile } from '../lib/users'

function Entrar() {
  const { user, loading, loginWithGoogle } = useAuth()
  const { profile } = useProfile()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/'

  const needsOnboarding = Boolean(user) && Boolean(profile) && profile.onboarded === false

  useEffect(() => {
    if (user && profile && profile.onboarded !== false) {
      navigate(redirectTo, { replace: true })
    }
  }, [user, profile, redirectTo, navigate])

  async function handleOnboardingSubmit(profileData) {
    await updateUserProfile(user.uid, { ...profileData, onboarded: true, acceptedTermsAt: serverTimestamp() })
    navigate(redirectTo, { replace: true })
  }

  if (loading || (user && !profile) || (user && !needsOnboarding)) {
    return (
      <Container>
        <div className="py-20 text-center text-ink-soft">Carregando...</div>
      </Container>
    )
  }

  return (
    <Container>
      <Helmet>
        <title>Entrar — Adota.THE</title>
      </Helmet>

      <div className="mx-auto max-w-[480px] py-16">
        {!user ? (
          <div className="text-center">
            <div className="mb-2.5 font-display text-2xl font-bold text-blue-deep">♡ Adota.THE</div>
            <p className="mb-8 text-ink-soft">
              Entre com sua conta Google para cadastrar pets, favoritar, conversar com doadores e avaliar adoções.
            </p>
            <Button variant="primary" onClick={() => loginWithGoogle()}>
              Continuar com Google
            </Button>
          </div>
        ) : (
          <div>
            <h1 className="mb-2 font-display text-2xl text-blue-deep">Complete seu perfil</h1>
            <p className="mb-6 text-ink-soft">
              Confirme como você quer aparecer para outras pessoas no Adota.THE antes de continuar.
            </p>
            <ProfileForm
              initialName={profile.displayName}
              initialPhotoURL={profile.photoURL}
              initialTutorType={profile.tutorType}
              submitLabel="Concluir e entrar →"
              requireConsent
              onSubmit={handleOnboardingSubmit}
            />
          </div>
        )}
      </div>
    </Container>
  )
}

export default Entrar
