import { useState } from 'react'
import Container from '../components/Container'
import Chip from '../components/Chip'
import { GridPetCard } from '../components/PetCard'
import { mockPets } from '../data/mockPets'

const filterGroups = [
  { label: 'Espécie', options: ['🐶 Cães', '🐱 Gatos'] },
  { label: 'Porte', options: ['Pequeno', 'Médio', 'Grande'] },
  { label: 'Idade', options: ['Filhote', 'Adulto', 'Idoso'] },
  { label: 'Sexo', options: ['Macho', 'Fêmea'] },
  { label: 'Temperamento', options: ['Dócil', 'Brincalhão', 'Calmo', 'Independente'] },
]

function Buscar() {
  const [active, setActive] = useState({ Espécie: '🐶 Cães', Porte: 'Médio', Idade: 'Adulto' })

  function toggle(group, option) {
    setActive((prev) => ({ ...prev, [group]: prev[group] === option ? null : option }))
  }

  return (
    <Container>
      <div className="pb-2 pt-8.5">
        <div className="mb-2 text-sm font-semibold text-terracotta">Cães e gatos perto de você</div>
        <h1 className="font-display text-[34px] text-blue-deep">Encontre seu próximo amigo</h1>
        <p className="mt-2.5 text-base text-ink-soft">
          Todos os animais aqui estão sob cuidado de pessoas ou protetores reais — nenhum anúncio é de loja.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-10 py-7.5 pb-17.5 md:grid-cols-[250px_1fr]">
        <aside className="sticky top-5 border-t-2 border-blue-deep pt-5">
          {filterGroups.map((group) => (
            <div key={group.label} className="mb-6.5">
              <h4 className="mb-3 text-[13px] font-bold text-ink">{group.label}</h4>
              <div className="flex flex-wrap gap-2">
                {group.options.map((option) => (
                  <Chip
                    key={option}
                    active={active[group.label] === option}
                    onClick={() => toggle(group.label, option)}
                  >
                    {option}
                  </Chip>
                ))}
              </div>
            </div>
          ))}
          <div
            className="cursor-pointer text-[13.5px] font-semibold text-blue-mid"
            onClick={() => setActive({})}
          >
            Limpar filtros
          </div>
        </aside>

        <main>
          <div className="mb-5 flex items-center justify-between">
            <div className="text-[15px] text-ink-soft">
              <strong className="text-ink">{mockPets.length}</strong> pets encontrados em Teresina, PI
            </div>
            <select className="rounded-lg border-[1.3px] border-line bg-white px-3 py-2 text-[13.5px] text-ink-soft">
              <option>Mais recentes</option>
              <option>Mais próximos</option>
              <option>Mais jovens</option>
            </select>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {mockPets.map((pet) => (
              <GridPetCard key={pet.id} pet={pet} />
            ))}
          </div>

          <div className="mt-11 flex justify-center gap-2">
            {['1', '2', '3', '→'].map((label, i) => (
              <span
                key={label}
                className={`flex h-9 w-9 items-center justify-center rounded-lg border-[1.3px] text-sm ${
                  i === 0 ? 'border-blue-deep bg-blue-deep text-cream' : 'border-line bg-white text-ink-soft'
                }`}
              >
                {label}
              </span>
            ))}
          </div>
        </main>
      </div>
    </Container>
  )
}

export default Buscar
