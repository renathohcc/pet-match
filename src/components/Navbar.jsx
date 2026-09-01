import { Link, NavLink } from 'react-router-dom'
import Button from './Button'
import { useAuth } from '../context/useAuth'
import { useProfile } from '../context/useProfile'

const navLinks = [
  { to: '/', label: 'Início' },
  { to: '/buscar', label: 'Encontrar um pet' },
  { to: '/cadastrar', label: 'Cadastrar pet' },
]

function Navbar() {
  const { user, loginWithGoogle, logout } = useAuth()
  const { profile } = useProfile()

  return (
    <nav className="mx-auto flex max-w-[1180px] items-center justify-between px-7 py-5">
      <Link to="/" className="flex items-center gap-2.5 font-display text-[22px] font-bold text-blue-deep">
        <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-blue-deep text-[17px] text-cream">
          ♡
        </span>
        PetMatch
      </Link>

      <div className="hidden gap-7.5 text-[15px] font-medium text-ink-soft md:flex">
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => (isActive ? 'text-blue-deep' : 'hover:text-blue-deep')}
          >
            {link.label}
          </NavLink>
        ))}
      </div>

      <div className="flex items-center gap-3.5">
        {user ? (
          <div className="flex items-center gap-2.5">
            <Link to="/perfil" title="Meu perfil">
              {profile?.photoURL ? (
                <img src={profile.photoURL} alt={profile.displayName} className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-mid text-sm font-semibold text-white">
                  {(profile?.displayName ?? user.displayName ?? 'U')[0]}
                </span>
              )}
            </Link>
            <Button variant="ghost" onClick={() => logout()}>
              Sair
            </Button>
          </div>
        ) : (
          <Button variant="ghost" onClick={() => loginWithGoogle()}>
            Entrar
          </Button>
        )}
        <Button as={Link} to="/cadastrar" variant="primary">
          Cadastrar pet
        </Button>
      </div>
    </nav>
  )
}

export default Navbar
