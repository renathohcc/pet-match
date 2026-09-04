import Container from './Container'
import { useAuth } from '../context/useAuth'
import { isAdmin } from '../lib/admin'

function RequireAdmin({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <Container>
        <div className="py-20 text-center text-ink-soft">Carregando...</div>
      </Container>
    )
  }

  if (!isAdmin(user?.uid)) {
    return (
      <Container>
        <div className="py-20 text-center text-ink-soft">Acesso restrito.</div>
      </Container>
    )
  }

  return children
}

export default RequireAdmin
