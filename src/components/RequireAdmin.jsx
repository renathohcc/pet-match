import { Link, useLocation } from 'react-router-dom'
import Container from './Container'
import Button from './Button'
import { useAuth } from '../context/useAuth'
import { isAdmin } from '../lib/admin'

function RequireAdmin({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

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
          <h1 className="mb-3 font-display text-2xl text-blue-deep">Entre para acessar</h1>
          <p className="mb-6 text-ink-soft">Essa área é restrita ao administrador do PetMatch. Entre com a conta correta para continuar.</p>
          <Button as={Link} to={`/entrar?redirectTo=${encodeURIComponent(location.pathname)}`} variant="primary">
            Entrar
          </Button>
        </div>
      </Container>
    )
  }

  if (!isAdmin(user.uid)) {
    return (
      <Container>
        <div className="mx-auto max-w-[420px] py-20 text-center">
          <h1 className="mb-3 font-display text-2xl text-blue-deep">Acesso restrito</h1>
          <p className="text-ink-soft">Essa conta não tem permissão de administrador.</p>
        </div>
      </Container>
    )
  }

  return children
}

export default RequireAdmin
