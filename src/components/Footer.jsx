import { Link } from 'react-router-dom'
import Container from './Container'

function Footer() {
  return (
    <footer className="mt-20 bg-blue-deep py-14 pb-8 text-[#C7D5E1]">
      <Container>
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="mb-2.5 font-display text-xl font-bold text-white">♡ PetMatch</div>
            <p className="max-w-[260px] text-sm">
              Uma plataforma para conectar animais que precisam de um lar a pessoas prontas para adotar com
              responsabilidade.
            </p>
          </div>
          <div>
            <h4 className="mb-3.5 text-sm font-semibold text-white">Navegar</h4>
            <ul className="flex flex-col gap-2.5 text-sm">
              <li><Link to="/buscar">Encontrar um pet</Link></li>
              <li><Link to="/#como-funciona">Como funciona</Link></li>
              <li><Link to="/#protetores">Para protetores</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3.5 text-sm font-semibold text-white">Sobre</h4>
            <ul className="flex flex-col gap-2.5 text-sm">
              <li><Link to="/#confianca">Adoção responsável</Link></li>
              <li><a href="#">Dúvidas frequentes</a></li>
              <li><a href="#">Denunciar anúncio</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3.5 text-sm font-semibold text-white">Redes</h4>
            <ul className="flex flex-col gap-2.5 text-sm">
              <li><a href="#">Instagram</a></li>
              <li><a href="#">Facebook</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-wrap justify-between gap-2.5 border-t border-white/10 pt-5.5 text-[13px] text-[#9FB3C4]">
          <span>© 2026 PetMatch. Plataforma gratuita, sem fins lucrativos.</span>
          <span>Feito para conectar pessoas e animais.</span>
        </div>
      </Container>
    </footer>
  )
}

export default Footer
