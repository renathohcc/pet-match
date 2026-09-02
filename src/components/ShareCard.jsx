import { useState } from 'react'
import Cropper from 'react-easy-crop'
import Button from './Button'
import Chip from './Chip'
import { COLOR_THEMES, generateShareImage, getSlotAspect, SHARE_FORMATS } from '../lib/shareImage'

function ShareCard({ pet, title = 'Compartilhe nas redes', subtitle, continueLabel, onContinue }) {
  const [formatId, setFormatId] = useState(SHARE_FORMATS[0].id)
  const [themeId, setThemeId] = useState(COLOR_THEMES[0].id)

  // Recorte compartilhado entre os formatos — só a proporção (aspect) do
  // overlay muda quando troca de formato, o zoom/posição escolhidos continuam.
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  const [previewUrl, setPreviewUrl] = useState(null)
  const [blob, setBlob] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [shareError, setShareError] = useState(null)
  // true assim que algo muda (recorte, zoom, formato ou cor) depois da última imagem gerada
  const [dirty, setDirty] = useState(true)

  function handleFormatChange(id) {
    setFormatId(id)
    setDirty(true)
  }

  function handleThemeChange(id) {
    setThemeId(id)
    setDirty(true)
  }

  function handleCropComplete(_, pixels) {
    setCroppedAreaPixels(pixels)
    setDirty(true)
  }

  async function handleGenerate() {
    setLoading(true)
    setError(null)

    try {
      const result = await generateShareImage({ pet, formatId, themeId, cropRect: croppedAreaPixels })
      setBlob(result)
      setPreviewUrl(URL.createObjectURL(result))
      setDirty(false)
    } catch {
      setError('Não foi possível gerar a imagem de compartilhamento agora.')
    } finally {
      setLoading(false)
    }
  }

  async function handleShare() {
    if (!blob) return
    setShareError(null)
    const file = new File([blob], `${pet.name}-petmatch.png`, { type: 'image/png' })

    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `${pet.name} está esperando por um lar — PetMatch`,
          text: `Conheça ${pet.name} no PetMatch, em ${pet.city}!`,
        })
      } catch (err) {
        if (err.name !== 'AbortError') setShareError('Não foi possível abrir o compartilhamento. Tente baixar a imagem.')
      }
      return
    }

    handleDownload()
  }

  function handleDownload() {
    if (!previewUrl) return
    const link = document.createElement('a')
    link.href = previewUrl
    link.download = `${pet.name}-petmatch.png`
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  return (
    <div className="mx-auto max-w-[420px] pb-4 pt-2 text-center">
      {subtitle && <div className="mb-2 text-sm font-semibold text-terracotta">{subtitle}</div>}
      <h1 className="mb-3 font-display text-2xl text-blue-deep">{title}</h1>
      <p className="mb-6 text-[14.5px] text-ink-soft">
        Uma imagem prontinha pra postar no Instagram, Facebook ou WhatsApp — mais gente vê, mais rápido{' '}
        {pet.name} encontra um lar.
      </p>

      <div className="mb-3 flex flex-wrap justify-center gap-2">
        {SHARE_FORMATS.map((f) => (
          <Chip key={f.id} active={formatId === f.id} onClick={() => handleFormatChange(f.id)}>
            {f.label}
          </Chip>
        ))}
      </div>
      <div className="mb-5 flex flex-wrap justify-center gap-2">
        {COLOR_THEMES.map((t) => (
          <Chip key={t.id} active={themeId === t.id} onClick={() => handleThemeChange(t.id)}>
            <span
              className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full align-middle"
              style={{ background: t.bg }}
            />
            {t.label}
          </Chip>
        ))}
      </div>

      <p className="mb-3 text-[13px] text-ink-soft">Arraste e use o zoom pra escolher a parte da foto que aparece.</p>
      <div className="relative mb-5 h-[320px] overflow-hidden rounded-2xl border border-line bg-black/5">
        <Cropper
          image={pet.image}
          crop={crop}
          zoom={zoom}
          aspect={getSlotAspect(formatId)}
          onCropChange={setCrop}
          onZoomChange={(z) => {
            setZoom(z)
            setDirty(true)
          }}
          onCropComplete={handleCropComplete}
        />
      </div>
      <input
        type="range"
        min={1}
        max={3}
        step={0.01}
        value={zoom}
        onChange={(e) => {
          setZoom(Number(e.target.value))
          setDirty(true)
        }}
        className="mb-5 w-full accent-blue-deep"
        aria-label="Zoom"
      />

      <Button variant="primary" onClick={handleGenerate} disabled={loading} className="mb-6 w-full">
        {loading ? 'Gerando...' : previewUrl ? 'Atualizar imagem' : 'Gerar imagem →'}
      </Button>

      {error && <p className="mb-4 text-sm text-terracotta">{error}</p>}

      {previewUrl && (
        <>
          <div className={`mb-3 overflow-hidden rounded-2xl border border-line bg-white transition-opacity ${dirty ? 'opacity-40' : ''}`}>
            <img src={previewUrl} alt={`Card de compartilhamento de ${pet.name}`} className="w-full" />
          </div>
          {dirty && (
            <p className="mb-4 text-[13px] text-terracotta">Você mudou algo — clique em "Atualizar imagem" acima.</p>
          )}

          {shareError && <p className="mb-4 text-sm text-terracotta">{shareError}</p>}

          <div className="flex flex-col gap-2.5">
            <Button variant="primary" onClick={handleShare} disabled={loading}>
              📤 Compartilhar
            </Button>
            <Button variant="ghost" onClick={handleDownload} disabled={loading}>
              ⬇ Baixar imagem
            </Button>
            {onContinue && (
              <Button variant="ghost" onClick={onContinue}>
                {continueLabel ?? 'Fechar'}
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default ShareCard
