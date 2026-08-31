import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Buscar from './pages/Buscar'
import Cadastrar from './pages/Cadastrar'
import PetDetail from './pages/PetDetail'

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/buscar" element={<Buscar />} />
        <Route path="/cadastrar" element={<Cadastrar />} />
        <Route path="/pet/:id" element={<PetDetail />} />
      </Routes>
      <Footer />
    </>
  )
}

export default App
