import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import Container from '../components/Container'
import Button from '../components/Button'
import { db } from '../lib/firebase'
import { uploadPetPhoto } from '../lib/cloudinary'
import { useAuth } from '../context/useAuth'
import { CITIES, neighborhoodsForCity } from '../data/locations'

const MAX_PHOTOS = 5

function Pick({ selected, children, ...props }) {
  return (
    <span
      className={`cursor-pointer rounded-full border-[1.4px] px-4.5 py-2.5 text-sm font-medium ${
        selected ? 'border-blue-deep bg-blue-deep text-cream' : 'border-line bg-white text-ink-soft'
      }`}
      {...props}
    >
      {children}
    </span>
  )
}

function Field({ label, children }) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-[13.5px] font-semibold text-ink">{label}</label>
      {children}
    </div>
  )
}

const fieldClass =
  'w-full rounded-[10px] border-[1.4px] border-line bg-white px-3.5 py-3 font-sans text-[15px] text-ink'

const steps = ['Informações básicas', 'Saúde e temperamento', 'Fotos', 'Localização e contato']
const healthOptions = ['Vacinado(a)', 'Vermifugado(a)', 'Castrado(a)', 'Necessidades especiais']
const temperamentOptions = ['Dócil', 'Bom com crianças', 'Bom com outros cães', 'Bom com gatos', 'Independente', 'Brincalhão']

function Cadastrar() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  const [name, setName] = useState('')
  const [species, setSpecies] = useState('cão')
  const [age, setAge] = useState('Adulto (6 meses a 7 anos)')
  const [sex, setSex] = useState('Fêmea')
  const [size, setSize] = useState('Médio')
  const [breed, setBreed] = useState('')
  const [health, setHealth] = useState(['Vacinado(a)', 'Vermifugado(a)', 'Castrado(a)'])
  const [temperament, setTemperament] = useState(['Dócil', 'Bom com crianças'])
  const [story, setStory] = useState('')
  const [photos, setPhotos] = useState([])
  const [city, setCity] = useState(CITIES[0].value)
  const [neighborhood, setNeighborhood] = useState('')
  const [whatsapp, setWhatsapp] = useState('')

  function handleCityChange(newCity) {
    setCity(newCity)
    setNeighborhood('')
  }

  function toggleTemperament(tag) {
    setTemperament((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  function toggleHealth(item) {
    setHealth((prev) => (prev.includes(item) ? prev.filter((h) => h !== item) : [...prev, item]))
  }

  function handlePhotosChange(e) {
    const files = Array.from(e.target.files ?? []).slice(0, MAX_PHOTOS)
    setPhotos(files)
  }

  function goNext() {
    setStep((s) => Math.min(s + 1, steps.length - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!user) return

    setSubmitting(true)
    setSubmitError(null)

    try {
      const photoUrls = []
      for (const file of photos) {
        photoUrls.push(await uploadPetPhoto(file))
      }

      const docRef = await addDoc(collection(db, 'pets'), {
        name,
        species,
        age,
        sex,
        size,
        breed: breed || 'SRD',
        health,
        temperament,
        story,
        city,
        neighborhood,
        whatsapp,
        image: photoUrls[0] ?? '',
        thumbs: photoUrls.slice(1),
        status: 'disponivel',
        donorId: user.uid,
        contactName: user.displayName ?? 'Doador',
        contactType: 'Doador independente',
        createdAt: serverTimestamp(),
      })

      navigate(`/pet/${docRef.id}`)
    } catch {
      setSubmitError('Não foi possível publicar o anúncio agora. Verifique os campos e tente novamente.')
      setSubmitting(false)
    }
  }

  const isLastStep = step === steps.length - 1

  return (
    <Container>
      <Helmet>
        <title>Cadastrar um pet para adoção — PetMatch</title>
        <meta name="description" content="Cadastre gratuitamente um cão ou gato para adoção responsável. Sem prazo de expiração." />
      </Helmet>

      <div className="pb-1.5 pt-9">
        <div className="mb-2 text-sm font-semibold text-terracotta">Cadastro gratuito, sem prazo de expiração</div>
        <h1 className="font-display text-[32px] text-blue-deep">Cadastrar um pet para adoção</h1>
        <p className="mt-2.5 max-w-[480px] text-ink-soft">
          Leva menos de 5 minutos. Quanto mais informação você der, mais rápido esse animal encontra um lar
          responsável.
        </p>
      </div>

      <div className="mx-auto flex max-w-[760px] gap-2 mt-7 mb-1.5">
        {steps.map((label, i) => (
          <div key={label} className={`h-1 flex-1 rounded ${i <= step ? 'bg-blue-deep' : 'bg-line'}`} />
        ))}
      </div>
      <div className="mx-auto mb-7.5 max-w-[760px] text-[13px] text-ink-soft">
        Etapa {step + 1} de {steps.length} — {steps[step]}
      </div>

      <form
        onSubmit={isLastStep ? handleSubmit : (e) => { e.preventDefault(); goNext() }}
        className="mx-auto max-w-[760px] pb-20"
      >
        {step === 0 && (
          <fieldset className="border-none p-0">
            <legend className="mb-4.5 font-display text-xl font-semibold text-blue-deep">Informações básicas</legend>
            <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Nome do animal">
                <input
                  className={fieldClass}
                  type="text"
                  placeholder="Ex: Mel"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Field>
              <Field label="Espécie">
                <div className="flex flex-wrap gap-2.5">
                  <Pick selected={species === 'cão'} onClick={() => setSpecies('cão')}>🐶 Cão</Pick>
                  <Pick selected={species === 'gato'} onClick={() => setSpecies('gato')}>🐱 Gato</Pick>
                </div>
              </Field>
            </div>
            <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Idade aproximada">
                <select className={fieldClass} value={age} onChange={(e) => setAge(e.target.value)}>
                  <option>Filhote (até 6 meses)</option>
                  <option>Adulto (6 meses a 7 anos)</option>
                  <option>Idoso (7+ anos)</option>
                </select>
              </Field>
              <Field label="Sexo">
                <div className="flex flex-wrap gap-2.5">
                  <Pick selected={sex === 'Fêmea'} onClick={() => setSex('Fêmea')}>Fêmea</Pick>
                  <Pick selected={sex === 'Macho'} onClick={() => setSex('Macho')}>Macho</Pick>
                </div>
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Porte">
                <div className="flex flex-wrap gap-2.5">
                  {['Pequeno', 'Médio', 'Grande'].map((s) => (
                    <Pick key={s} selected={size === s} onClick={() => setSize(s)}>{s}</Pick>
                  ))}
                </div>
              </Field>
              <Field label="Raça (opcional)">
                <input
                  className={fieldClass}
                  type="text"
                  placeholder="Ex: SRD, Labrador..."
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                />
              </Field>
            </div>
          </fieldset>
        )}

        {step === 1 && (
          <>
            <fieldset className="mb-10 border-none p-0">
              <legend className="mb-4.5 font-display text-xl font-semibold text-blue-deep">Saúde</legend>
              <div className="flex flex-wrap gap-5.5">
                {healthOptions.map((label) => (
                  <label key={label} className="flex items-center gap-2.5 text-[14.5px]">
                    <input
                      type="checkbox"
                      checked={health.includes(label)}
                      onChange={() => toggleHealth(label)}
                      className="h-4.5 w-4.5"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="mb-10 border-none p-0">
              <legend className="mb-4.5 font-display text-xl font-semibold text-blue-deep">Temperamento</legend>
              <div className="flex flex-wrap gap-2.5">
                {temperamentOptions.map((tag) => (
                  <Pick key={tag} selected={temperament.includes(tag)} onClick={() => toggleTemperament(tag)}>
                    {tag}
                  </Pick>
                ))}
              </div>
            </fieldset>

            <fieldset className="border-none p-0">
              <legend className="mb-4.5 font-display text-xl font-semibold text-blue-deep">História do animal</legend>
              <textarea
                className={`${fieldClass} min-h-[100px] resize-y`}
                placeholder="Conte como encontrou o animal, o temperamento dele e o que ele precisa em um novo lar..."
                value={story}
                onChange={(e) => setStory(e.target.value)}
              />
            </fieldset>
          </>
        )}

        {step === 2 && (
          <fieldset className="border-none p-0">
            <legend className="mb-4.5 font-display text-xl font-semibold text-blue-deep">Fotos</legend>
            <label className="block cursor-pointer rounded-[14px] border-[1.8px] border-dashed border-line bg-cream-2 p-9 text-center text-[14.5px] text-ink-soft">
              <input type="file" accept="image/*" multiple onChange={handlePhotosChange} className="hidden" />
              <strong className="mb-1 block text-[15px] text-blue-deep">
                {photos.length > 0 ? `${photos.length} foto(s) selecionada(s)` : 'Clique para enviar fotos'}
              </strong>
              Fotos nítidas e recentes aumentam muito a chance de adoção. Até {MAX_PHOTOS} fotos.
            </label>
            {photos.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2.5">
                {photos.map((file) => (
                  <img
                    key={file.name + file.lastModified}
                    src={URL.createObjectURL(file)}
                    alt=""
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                ))}
              </div>
            )}
          </fieldset>
        )}

        {step === 3 && (
          <fieldset className="border-none p-0">
            <legend className="mb-4.5 font-display text-xl font-semibold text-blue-deep">Localização e contato</legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Cidade">
                <select className={fieldClass} value={city} onChange={(e) => handleCityChange(e.target.value)}>
                  {CITIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.value}</option>
                  ))}
                </select>
              </Field>
              <Field label="Bairro">
                <select
                  className={fieldClass}
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  required
                >
                  <option value="" disabled>Selecione o bairro</option>
                  {neighborhoodsForCity(city).map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="WhatsApp para contato">
                <input
                  className={fieldClass}
                  type="text"
                  placeholder="(00) 00000-0000"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  required
                />
              </Field>
            </div>
          </fieldset>
        )}

        {submitError && <p className="mt-4 text-sm text-terracotta">{submitError}</p>}

        <div className="mt-10 flex items-center justify-between border-t border-line pt-6.5">
          {step > 0 ? (
            <Button type="button" variant="ghost" onClick={goBack} disabled={submitting}>
              ← Voltar
            </Button>
          ) : (
            <span />
          )}

          {isLastStep ? (
            <div className="flex items-center gap-4">
              <div className="max-w-[280px] text-[13px] text-ink-soft">
                Ao publicar, você confirma que o anúncio é exclusivamente para adoção — sem venda ou cobrança de
                valores pelo animal.
              </div>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? 'Publicando...' : 'Publicar anúncio →'}
              </Button>
            </div>
          ) : (
            <Button type="submit" variant="primary">
              Próximo →
            </Button>
          )}
        </div>
      </form>
    </Container>
  )
}

export default Cadastrar
