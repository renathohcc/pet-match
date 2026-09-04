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
