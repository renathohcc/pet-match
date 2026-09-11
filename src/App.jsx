import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import RequireAuth from './components/RequireAuth'
import RequireAdmin from './components/RequireAdmin'
import Home from './pages/Home'
import Buscar from './pages/Buscar'
import Cadastrar from './pages/Cadastrar'
import PetDetail from './pages/PetDetail'
import Profile from './pages/Profile'
import PublicProfile from './pages/PublicProfile'
import Admin from './pages/Admin'
import DuvidasFrequentes from './pages/DuvidasFrequentes'
import Denunciar from './pages/Denunciar'
import Entrar from './pages/Entrar'
import Pedidos from './pages/Pedidos'
import Privacidade from './pages/Privacidade'
import Termos from './pages/Termos'

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/buscar" element={<Buscar />} />
        <Route
          path="/cadastrar"
          element={
            <RequireAuth>
              <Cadastrar />
            </RequireAuth>
          }
        />
        <Route path="/pet/:id" element={<PetDetail />} />
        <Route
          path="/perfil"
          element={
            <RequireAuth title="Entre para ver seu perfil" message="Faça login com Google para ver seus dados e os pets que você cadastrou.">
              <Profile />
            </RequireAuth>
          }
        />
        <Route path="/usuario/:uid" element={<PublicProfile />} />
        <Route path="/duvidas-frequentes" element={<DuvidasFrequentes />} />
        <Route path="/privacidade" element={<Privacidade />} />
        <Route path="/termos" element={<Termos />} />
        <Route path="/denunciar" element={<Denunciar />} />
        <Route path="/entrar" element={<Entrar />} />
        <Route
          path="/pedidos"
          element={
            <RequireAuth title="Entre para ver seus pedidos" message="Faça login com Google para ver os pedidos de interesse que você recebeu ou fez.">
              <Pedidos />
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <Admin />
            </RequireAdmin>
          }
        />
      </Routes>
      <Footer />
    </>
  )
}

export default App
