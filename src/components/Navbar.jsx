import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import Button from './Button'
import { useAuth } from '../context/useAuth'
import { useProfile } from '../context/useProfile'
import { isAdmin } from '../lib/admin'

const navLinks = [
  { to: '/', label: 'Início' },
  { to: '/buscar', label: 'Encontrar um pet' },
]

function Navbar() {
  const { user, logout } = useAuth()
  const { profile } = useProfile()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="relative mx-auto flex max-w-[1180px] items-center justify-between px-7 py-5">
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
            {isAdmin(user.uid) && (
              <Link to="/admin" className="hidden text-[13px] font-semibold text-terracotta hover:underline sm:inline">
                Admin
              </Link>
            )}
            <Link to="/perfil" title="Meu perfil">
              {profile?.photoURL ? (
                <img src={profile.photoURL} alt={profile.displayName} className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-mid text-sm font-semibold text-white">
                  {(profile?.displayName ?? user.displayName ?? 'U')[0]}
                </span>
              )}
            </Link>
            <span className="hidden sm:inline-block">
              <Button variant="ghost" onClick={() => logout()}>
                Sair
              </Button>
            </span>
          </div>
        ) : (
          <span className="hidden sm:inline-block">
            <Button as={Link} to="/entrar" variant="ghost">
              Entrar
            </Button>
          </span>
        )}
        <span className="hidden sm:inline-block">
          <Button as={Link} to="/cadastrar" variant="primary">
            Cadastrar pet
          </Button>
        </span>

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuOpen}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-line bg-white text-lg text-blue-deep md:hidden"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {menuOpen && (
        <div className="absolute left-0 right-0 top-full z-40 flex flex-col gap-1 border-b border-line bg-cream px-7 py-4 shadow-[0_12px_28px_rgba(22,50,79,.1)] md:hidden">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `rounded-lg px-2 py-2.5 text-[15px] font-medium ${isActive ? 'text-blue-deep' : 'text-ink-soft hover:text-blue-deep'}`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <NavLink
            to="/cadastrar"
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) =>
              `rounded-lg px-2 py-2.5 text-[15px] font-medium ${isActive ? 'text-blue-deep' : 'text-ink-soft hover:text-blue-deep'}`
            }
          >
            Cadastrar pet
          </NavLink>
          {user && (
            <>
              {isAdmin(user.uid) && (
                <Link
                  to="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-2 py-2.5 text-[15px] font-medium text-terracotta"
                >
                  Admin
                </Link>
              )}
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  logout()
                }}
                className="cursor-pointer rounded-lg px-2 py-2.5 text-left text-[15px] font-medium text-ink-soft hover:text-blue-deep"
              >
                Sair
              </button>
            </>
          )}
          {!user && (
            <Link
              to="/entrar"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-2 py-2.5 text-[15px] font-medium text-ink-soft hover:text-blue-deep"
            >
              Entrar
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}

export default Navbar
