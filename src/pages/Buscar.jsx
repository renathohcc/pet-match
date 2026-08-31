import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import Container from '../components/Container'
import Chip from '../components/Chip'
import { GridPetCard } from '../components/PetCard'
import { listAvailablePets } from '../lib/pets'
import { CITIES, neighborhoodsForCity } from '../data/locations'

const speciesOptions = [
  { label: '🐶 Cães', value: 'cão' },
  { label: '🐱 Gatos', value: 'gato' },
]
const sizeOptions = ['Pequeno', 'Médio', 'Grande']
const sexOptions = ['Macho', 'Fêmea']
// TODO (v1.1): idade/temperamento exigem normalizar o schema dos pets antes de
// virar filtro de query real — por enquanto ficam só como recorte visual do mockup.
const ageOptions = ['Filhote', 'Adulto', 'Idoso']
const temperamentOptions = ['Dócil', 'Brincalhão', 'Calmo', 'Independente']

function Buscar() {
  const [pets, setPets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [species, setSpecies] = useState('cão')
  const [size, setSize] = useState(null)
  const [sex, setSex] = useState(null)
  const [city, setCity] = useState(null)
  const [neighborhood, setNeighborhood] = useState(null)

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- feedback imediato de loading ao trocar filtro
    setLoading(true)
    setError(null)

    listAvailablePets({ species, size, sex, city, neighborhood })
      .then((result) => {
        if (!cancelled) setPets(result)
      })
      .catch(() => {
        if (!cancelled) setError('Não foi possível carregar os pets agora. Tente novamente em instantes.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [species, size, sex, city, neighborhood])

  function handleCityToggle(value) {
    const next = city === value ? null : value
    setCity(next)
    setNeighborhood(null)
  }

  function clearFilters() {
    setSpecies(null)
    setSize(null)
    setSex(null)
    setCity(null)
    setNeighborhood(null)
  }

  return (
    <Container>
      <Helmet>
        <title>Buscar pets para adoção — PetMatch</title>
        <meta name="description" content="Encontre cães e gatos para adoção responsável perto de você. Filtre por espécie, porte e sexo." />
      </Helmet>

      <div className="pb-2 pt-8.5">
        <div className="mb-2 text-sm font-semibold text-terracotta">Cães e gatos perto de você</div>
        <h1 className="font-display text-[34px] text-blue-deep">Encontre seu próximo amigo</h1>
        <p className="mt-2.5 text-base text-ink-soft">
          Todos os animais aqui estão sob cuidado de pessoas ou protetores reais — nenhum anúncio é de loja.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-10 py-7.5 pb-17.5 md:grid-cols-[250px_1fr]">
        <aside className="sticky top-5 border-t-2 border-blue-deep pt-5">
          <div className="mb-6.5">
            <h4 className="mb-3 text-[13px] font-bold text-ink">Cidade</h4>
            <div className="flex flex-wrap gap-2">
              {CITIES.map((c) => (
                <Chip key={c.value} active={city === c.value} onClick={() => handleCityToggle(c.value)}>
                  {c.value}
                </Chip>
              ))}
            </div>
          </div>

          {city && (
            <div className="mb-6.5">
              <h4 className="mb-3 text-[13px] font-bold text-ink">Bairro</h4>
              <select
                className="w-full rounded-[9px] border-[1.3px] border-line bg-white px-3 py-2.5 text-[13.5px] text-ink-soft"
                value={neighborhood ?? ''}
                onChange={(e) => setNeighborhood(e.target.value || null)}
              >
                <option value="">Todos os bairros</option>
                {neighborhoodsForCity(city).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          )}

          <div className="mb-6.5">
            <h4 className="mb-3 text-[13px] font-bold text-ink">Espécie</h4>
            <div className="flex flex-wrap gap-2">
              {speciesOptions.map((opt) => (
                <Chip
                  key={opt.value}
                  active={species === opt.value}
                  onClick={() => setSpecies(species === opt.value ? null : opt.value)}
                >
                  {opt.label}
                </Chip>
              ))}
            </div>
          </div>

          <div className="mb-6.5">
            <h4 className="mb-3 text-[13px] font-bold text-ink">Porte</h4>
            <div className="flex flex-wrap gap-2">
              {sizeOptions.map((opt) => (
                <Chip key={opt} active={size === opt} onClick={() => setSize(size === opt ? null : opt)}>
                  {opt}
                </Chip>
              ))}
            </div>
          </div>

          <div className="mb-6.5">
            <h4 className="mb-3 text-[13px] font-bold text-ink">Idade</h4>
            <div className="flex flex-wrap gap-2">
              {ageOptions.map((opt) => (
                <Chip key={opt}>{opt}</Chip>
              ))}
            </div>
          </div>

          <div className="mb-6.5">
            <h4 className="mb-3 text-[13px] font-bold text-ink">Sexo</h4>
            <div className="flex flex-wrap gap-2">
              {sexOptions.map((opt) => (
                <Chip key={opt} active={sex === opt} onClick={() => setSex(sex === opt ? null : opt)}>
                  {opt}
                </Chip>
              ))}
            </div>
          </div>

          <div className="mb-6.5">
            <h4 className="mb-3 text-[13px] font-bold text-ink">Temperamento</h4>
            <div className="flex flex-wrap gap-2">
              {temperamentOptions.map((opt) => (
                <Chip key={opt}>{opt}</Chip>
              ))}
            </div>
          </div>

          <div className="cursor-pointer text-[13.5px] font-semibold text-blue-mid" onClick={clearFilters}>
            Limpar filtros
          </div>
        </aside>

        <main>
          <div className="mb-5 flex items-center justify-between">
            <div className="text-[15px] text-ink-soft">
              <strong className="text-ink">{loading ? '...' : pets.length}</strong> pets encontrados
            </div>
            <select className="rounded-lg border-[1.3px] border-line bg-white px-3 py-2 text-[13.5px] text-ink-soft">
              <option>Mais recentes</option>
              <option>Mais próximos</option>
              <option>Mais jovens</option>
            </select>
          </div>

          {loading && <p className="text-ink-soft">Carregando pets...</p>}
          {error && <p className="text-terracotta">{error}</p>}

          {!loading && !error && pets.length === 0 && (
            <p className="text-ink-soft">Nenhum pet encontrado com esses filtros.</p>
          )}

          {!loading && !error && pets.length > 0 && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {pets.map((pet) => (
                <GridPetCard key={pet.id} pet={pet} />
              ))}
            </div>
          )}
        </main>
      </div>
    </Container>
  )
}

export default Buscar
