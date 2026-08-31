import Container from './Container'
import Button from './Button'
import { useAuth } from '../context/useAuth'

function RequireAuth({
  children,
  title = 'Entre para cadastrar um pet',
  message = 'Pra garantir que cada anúncio tenha um responsável de verdade, o cadastro de pets exige login. Navegar e adotar continuam livres, sem precisar entrar.',
}) {
  const { user, loading, loginWithGoogle } = useAuth()

  if (loading) {
    return (
      <Container>
        <div className="py-20 text-center text-ink-soft">Carregando...</div>
      </Container>
    )
  }

  if (!user) {
    return (
      <Container>
        <div className="mx-auto max-w-[420px] py-20 text-center">
          <h1 className="mb-3 font-display text-2xl text-blue-deep">{title}</h1>
          <p className="mb-6 text-ink-soft">{message}</p>
          <Button variant="primary" onClick={() => loginWithGoogle()}>
            Entrar com Google
          </Button>
        </div>
      </Container>
    )
  }

  return children
}

export default RequireAuth
