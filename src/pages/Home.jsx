import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Container from '../components/Container'
import Button from '../components/Button'
import { FeaturePetCard } from '../components/PetCard'
import { listAvailablePets } from '../lib/pets'

const featurePlacement = [
  'col-span-2 row-span-2',
  'col-span-2',
  'col-span-2',
  '',
  '',
  'col-span-2',
]

function Home() {
  const [featured, setFeatured] = useState([])

  useEffect(() => {
    let cancelled = false
    listAvailablePets().then((pets) => {
      if (!cancelled) setFeatured(pets.slice(0, 6))
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <section className="mx-auto grid max-w-[1180px] grid-cols-1 items-center gap-8.5 px-7 pb-15 pt-2.5 md:grid-cols-[1.05fr_0.95fr] md:gap-14">
        <div>
          <div className="mb-3.5 text-[15px] font-semibold text-terracotta">
            Adoção responsável de cães e gatos
          </div>
          <h1 className="font-display text-[38px] font-semibold leading-[1.08] text-blue-deep md:text-[52px]">
            Um lar esperado
            <br />
            por quem já esperou
            <br />
            demais.
          </h1>
          <p className="my-5 max-w-[440px] text-lg text-ink-soft">
            Sem venda. Sem cruza. Só o encontro entre quem tem um animal precisando de família e quem está pronto
            para recebê-lo.
          </p>
          <div className="mb-4.5 flex gap-2.5">
            <span className="cursor-pointer rounded-full border-[1.5px] border-blue-deep bg-[#EDF2F6] px-4.5 py-2.5 text-[14.5px] font-semibold text-blue-deep">
              🐶 Cães
            </span>
            <span className="cursor-pointer rounded-full border-[1.5px] border-line bg-white px-4.5 py-2.5 text-[14.5px] font-semibold text-ink-soft">
              🐱 Gatos
            </span>
          </div>
          <div className="flex max-w-[460px] gap-0 rounded-xl border-[1.5px] border-line bg-white p-1.5">
            <input
              type="text"
              defaultValue="Teresina, PI"
              placeholder="Sua cidade"
              className="flex-1 border-none bg-transparent px-3 py-2.5 text-[15px] outline-none"
            />
            <Button as={Link} to="/buscar" variant="primary">
              Buscar
            </Button>
          </div>
          <div className="mt-5.5 flex items-center gap-2.5 text-sm text-ink-soft">
            <div className="flex">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="-ml-2 h-7 w-7 rounded-full border-2 border-cream bg-blue-mid first:ml-0"
                />
              ))}
            </div>
            Cadastrado por pessoas e protetores independentes — sem intermediação.
          </div>
        </div>

        <div className="relative">
          <div className="relative aspect-[4/4.6] overflow-hidden rounded-[22px] bg-gradient-to-br from-[#E7DEC9] to-[#D8CBAE]">
            <img
              src="https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=700&q=80"
              alt="Cachorro esperando adoção"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="absolute bottom-6.5 left-4 max-w-[230px] rounded-xl border border-line bg-white p-4.5 text-[13.5px] font-semibold text-blue-deep shadow-[0_12px_28px_rgba(22,50,79,.14)] md:-left-6">
            "Ela só precisava de alguém disposto a esperar." — sobre a Mel, adotada via PetMatch
          </div>
        </div>
      </section>

      <Container>
        <section className="py-16" id="pets">
          <div className="mb-7.5 flex items-end justify-between gap-5">
            <h2 className="font-display text-[30px] text-blue-deep">Esperando por um lar</h2>
            <Link to="/buscar" className="whitespace-nowrap text-[14.5px] font-semibold text-blue-mid">
              Ver todos →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 auto-rows-[170px] md:grid-cols-6 md:auto-rows-[190px]">
            {featured.map((pet, i) => (
              <FeaturePetCard key={pet.id} pet={pet} className={featurePlacement[i]} />
            ))}
          </div>
        </section>

        <section className="py-16" id="confianca">
          <div className="grid grid-cols-1 items-center gap-10 rounded-[20px] bg-blue-deep p-9 text-cream md:grid-cols-2 md:p-13">
            <div>
              <h2 className="max-w-[420px] font-display text-[28px] text-cream">
                O PetMatch conecta pessoas e animais. A adoção é feita direto com quem cuida do pet.
              </h2>
              <p className="mt-3 max-w-[420px] text-base text-[#C7D5E1]">
                Sem loja, sem comissão, sem cadastro de venda. Cada anúncio representa um animal real, precisando de
                um lar real.
              </p>
            </div>
            <ul className="flex flex-col gap-4">
              {[
                ['Sem venda, sem cruza', 'A plataforma existe só para adoção responsável — não para comercialização de animais.'],
                ['Contato direto', 'Você fala com o responsável pelo pet via WhatsApp, sem intermediários.'],
                ['Informação antes da emoção', 'Idade, porte, saúde e temperamento — tudo visível antes de decidir.'],
              ].map(([title, desc], i) => (
                <li key={title} className={`flex gap-3.5 ${i > 0 ? 'border-t border-white/15 pt-4' : ''}`}>
                  <div>
                    <strong className="block text-[15.5px] text-white">{title}</strong>
                    <span className="text-sm text-[#B9CADA]">{desc}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="py-16" id="como-funciona">
          <div className="mb-7.5">
            <h2 className="font-display text-[30px] text-blue-deep">Como funciona</h2>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              ['01', 'Encontre', 'Filtre por cidade, espécie, porte e idade para ver quem está perto de você.'],
              ['02', 'Conheça', 'Veja a história, o temperamento e as necessidades de cada animal.'],
              ['03', 'Converse', 'Fale direto com o responsável pelo pet e combine a adoção sem burocracia.'],
            ].map(([num, title, desc]) => (
              <div key={num} className="border-t-2 border-blue-deep pt-4.5">
                <div className="font-display text-[15px] font-bold text-terracotta">{num}</div>
                <h3 className="my-2.5 text-[19px] text-blue-deep">{title}</h3>
                <p className="text-[15px] text-ink-soft">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-16" id="protetores">
          <div className="grid grid-cols-1 overflow-hidden rounded-[20px] border border-line bg-cream-2 md:grid-cols-[1.1fr_0.9fr]">
            <div className="order-2 p-11 md:order-1">
              <h2 className="max-w-[380px] font-display text-[27px] text-blue-deep">
                Cuida de um animal que precisa de um lar?
              </h2>
              <p className="my-3.5 max-w-[380px] text-ink-soft">
                Protetores independentes e pequenas ONGs podem cadastrar quantos pets precisarem, de graça, sem
                prazo de expiração.
              </p>
              <Button as={Link} to="/cadastrar" variant="terracotta">
                Cadastrar um pet
              </Button>
            </div>
            <div className="order-1 min-h-[200px] bg-gradient-to-br from-[#DCD0B5] to-[#C9B98D] md:order-2 md:min-h-[220px]">
              <img
                src="https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=600&q=80"
                alt="Protetor com cachorro"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="mb-7.5">
            <h2 className="font-display text-[30px] text-blue-deep">Quem já encontrou</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              ['Procurava um cachorro de porte médio há meses. Encontrei a Mel pelo PetMatch e em três dias ela já estava em casa.', 'Mariana', 'Teresina, PI'],
              ['Uso pra divulgar os resgates da nossa ONG. É bem mais fácil que depender só do Instagram.', 'João', 'Voluntário em ONG'],
              ['Falei direto com quem estava cuidando do Fred pelo WhatsApp. Sem cadastro complicado, sem enrolação.', 'Luiza', 'Protetora independente'],
            ].map(([quote, name, role]) => (
              <div key={name} className="rounded-2xl border border-line bg-white p-6.5">
                <p className="mb-4.5 text-[15.5px] italic text-ink">"{quote}"</p>
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-blue-mid" />
                  <div>
                    <strong className="block text-sm">{name}</strong>
                    <span className="text-[12.5px] text-ink-soft">{role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </Container>
    </>
  )
}

export default Home
