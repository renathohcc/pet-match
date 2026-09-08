import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import Container from '../components/Container'

const FAQ = [
  {
    q: 'O PetMatch cobra alguma taxa para adotar ou cadastrar um pet?',
    a: 'Não. O PetMatch é uma plataforma gratuita e sem fins lucrativos. Desconfie de qualquer pessoa que peça pagamento, sinal ou taxa de reserva antes do encontro — isso não é adoção responsável e deve ser denunciado.',
  },
  {
    q: 'Como funciona o contato com quem está doando o pet?',
    a: 'O PetMatch não intermedia a conversa: ao clicar em "Conversar no WhatsApp" você é direcionado direto para o número informado pelo responsável pelo anúncio. Combine tudo (visita, entrega, documentação do pet) diretamente com essa pessoa.',
  },
  {
    q: 'Preciso ter conta para navegar e ver os pets disponíveis?',
    a: 'Não. Buscar e ver anúncios é livre para qualquer visitante. Login com Google só é exigido para ações específicas: cadastrar um pet, favoritar, conversar no WhatsApp com o doador e avaliar depois de uma adoção — assim garantimos que sempre existe um responsável identificável por trás de cada ação.',
  },
  {
    q: 'Como faço para cadastrar um pet para adoção?',
    a: 'Clique em "Cadastrar pet" no topo do site, entre com sua conta Google e preencha o formulário com fotos, informações do animal e seu contato. O anúncio fica visível publicamente assim que enviado.',
  },
  {
    q: 'Como marco meu anúncio como adotado?',
    a: 'Na página do pet, altere o status do anúncio para "Adotado". Nesse momento você pode registrar quem foi a pessoa adotante para liberar as avaliações mútuas.',
  },
  {
    q: 'Vi um anúncio suspeito ou um caso de maus-tratos. O que eu faço?',
    a: (
      <>
        Use o link{' '}
        <Link to="/denunciar" className="text-blue-mid hover:underline">
          Denunciar anúncio
        </Link>{' '}
        na página do pet ou no rodapé do site. Nossa equipe analisa cada denúncia manualmente.
      </>
    ),
  },
  {
    q: 'O PetMatch verifica os anúncios ou as pessoas que cadastram pets?',
    a: 'Não há verificação de documentos ou visitas presenciais — o PetMatch é um espaço de conexão, não uma ONG de fiscalização. Por isso pedimos que toda combinação (encontro, entrega, adoção) seja feita com cautela, preferencialmente em local seguro e à luz do dia.',
  },
]

function DuvidasFrequentes() {
  return (
    <Container>
      <Helmet>
        <title>Dúvidas frequentes — PetMatch</title>
      </Helmet>

      <div className="mx-auto max-w-[720px] py-12">
        <h1 className="mb-2 font-display text-[32px] text-blue-deep">Dúvidas frequentes</h1>
        <p className="mb-9 text-ink-soft">Tudo que você precisa saber para usar o PetMatch com segurança.</p>

        <div className="flex flex-col gap-5">
          {FAQ.map((item, i) => (
            <div key={i} className="rounded-2xl border border-line bg-white p-5.5">
              <h3 className="mb-2 text-[16px] font-bold text-blue-deep">{item.q}</h3>
              <p className="text-[14.5px] leading-relaxed text-ink-soft">{item.a}</p>
            </div>
          ))}
        </div>

        <p className="mt-9 text-[13.5px] text-ink-soft">
          Não encontrou o que precisava? Fale com a gente pelo{' '}
          <a href="https://www.instagram.com/petmatchthe/" target="_blank" rel="noreferrer" className="text-blue-mid hover:underline">
            Instagram
          </a>.
        </p>
      </div>
    </Container>
  )
}

export default DuvidasFrequentes
