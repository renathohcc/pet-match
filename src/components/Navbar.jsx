import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import Button from './Button'
import { useAuth } from '../context/useAuth'
import { useProfile } from '../context/useProfile'
import { useNotifications } from '../context/useNotifications'
import { deleteAdoptionConfirmedNotification, deleteInterestAcceptedNotification } from '../lib/notifications'
import { isAdmin } from '../lib/admin'

const navLinks = [
  { to: '/', label: 'Início' },
  { to: '/buscar', label: 'Encontrar um pet' },
]

function notificationText(n) {
  if (n.type === 'interest_request') return `🐾 ${n.fromUserName} tem interesse em adotar ${n.petName}`
  if (n.type === 'interest_accepted') return `✅ Seu interesse em ${n.petName} foi aceito — você já pode conversar!`
  if (n.type === 'adoption_confirm_request') return `🎉 Você foi escolhido(a) como adotante de ${n.petName} — confirme!`
  if (n.type === 'adoption_confirmed') return `🏡 ${n.fromUserName} confirmou a adoção de ${n.petName}!`
  return n.direction === 'donor_to_adopter'
    ? `⭐ Avalie sua experiência com quem adotou ${n.petName}`
    : `⭐ Avalie sua experiência com quem doou ${n.petName}`
}

function notificationLink(n) {
  if (n.type === 'review_reminder') return `/pet/${n.petId}?avaliar=${n.direction}`
  if (n.type === 'interest_request' || n.type === 'interest_accepted' || n.type === 'adoption_confirm_request' || n.type === 'adoption_confirmed') {
    return '/pedidos'
  }
  return `/pet/${n.petId}`
}

// Só notificações puramente informativas somem ao clicar — as que exigem
// uma ação de verdade (pedido de interesse, lembrete de avaliação, pedido
// de confirmação de adoção) só somem quando a ação é feita em /pedidos ou
// na página do pet, nunca só por ter sido vista.
function dismissOnClick(n) {
  if (n.type === 'interest_accepted') return () => deleteInterestAcceptedNotification(n.petId, n.userId)
  if (n.type === 'adoption_confirmed') return () => deleteAdoptionConfirmedNotification(n.petId, n.userId)
  return null
}

function Navbar() {
  const { user, logout } = useAuth()
  const { profile } = useProfile()
  const { notifications } = useNotifications()
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  return (
    <nav className="relative mx-auto flex max-w-[1180px] items-center justify-between px-7 py-5">
      <Link to="/" className="flex items-center gap-2.5 font-display text-[22px] font-bold text-blue-deep">
        <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-blue-deep text-[17px] text-cream">
          ♡
        </span>
        Adota.THE
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
            <Link to="/pedidos" className="hidden text-[13px] font-semibold text-blue-mid hover:underline sm:inline">
              🐾 Pedidos
            </Link>
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

        {user && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotifOpen((v) => !v)}
              aria-label={notifications.length > 0 ? `${notifications.length} notificação(ões) pendente(s)` : 'Notificações'}
              aria-expanded={notifOpen}
              className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-line bg-white text-lg text-blue-deep"
            >
              🔔
              {notifications.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-terracotta px-1 text-[10px] font-bold text-white">
                  {notifications.length}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full z-40 mt-2 w-[280px] rounded-xl border border-line bg-white p-2 shadow-[0_12px_28px_rgba(22,50,79,.14)]">
                {notifications.length === 0 ? (
                  <p className="px-2.5 py-3 text-center text-[13px] text-ink-soft">Nenhuma pendência por aqui. 🎉</p>
                ) : (
                  notifications.map((n) => (
                    <Link
                      key={n.id}
                      to={notificationLink(n)}
                      onClick={() => {
                        setNotifOpen(false)
                        dismissOnClick(n)?.().catch(() => {})
                      }}
                      className="block rounded-lg px-2.5 py-2.5 text-[13.5px] text-ink hover:bg-cream-2"
                    >
                      {notificationText(n)}
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
        )}

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
              <Link
                to="/pedidos"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-2 py-2.5 text-[15px] font-medium text-ink-soft hover:text-blue-deep"
              >
                🐾 Pedidos
              </Link>
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
