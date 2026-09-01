import { useEffect, useState } from 'react'
import Cropper from 'react-easy-crop'
import Button from './Button'
import Chip from './Chip'
import { generateShareImage, getSlotAspect, SHARE_TEMPLATES } from '../lib/shareImage'

function ShareCard({ pet, title = 'Compartilhe nas redes', subtitle, continueLabel, onContinue }) {
  const [templateId, setTemplateId] = useState(SHARE_TEMPLATES[0].id)
  const [stage, setStage] = useState('crop') // 'crop' | 'preview'

  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  const [previewUrl, setPreviewUrl] = useState(null)
  const [blob, setBlob] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [shareError, setShareError] = useState(null)

  // Trocar de template pode mudar a proporção do recorte — volta pro passo de recorte.
  function handleTemplateChange(id) {
    setTemplateId(id)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setStage('crop')
  }

  function handleGenerate() {
    setStage('preview')
  }

  useEffect(() => {
    if (stage !== 'preview') return
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- feedback imediato de loading ao gerar
    setLoading(true)
    setError(null)

    generateShareImage({ pet, templateId, cropRect: croppedAreaPixels })
      .then((result) => {
        if (cancelled) return
        setBlob(result)
        setPreviewUrl(URL.createObjectURL(result))
      })
      .catch(() => {
        if (!cancelled) setError('Não foi possível gerar a imagem de compartilhamento agora.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `pet` é estável
  }, [stage])

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
    link.click()
  }

  return (
    <div className="mx-auto max-w-[420px] pb-4 pt-2 text-center">
      {subtitle && <div className="mb-2 text-sm font-semibold text-terracotta">{subtitle}</div>}
      <h1 className="mb-3 font-display text-2xl text-blue-deep">{title}</h1>
      <p className="mb-6 text-[14.5px] text-ink-soft">
        Uma imagem prontinha pra postar no Instagram, Facebook ou WhatsApp — mais gente vê, mais rápido{' '}
        {pet.name} encontra um lar.
      </p>

      <div className="mb-5 flex flex-wrap justify-center gap-2">
        {SHARE_TEMPLATES.map((t) => (
          <Chip key={t.id} active={templateId === t.id} onClick={() => handleTemplateChange(t.id)}>
            {t.label}
          </Chip>
        ))}
      </div>

      {stage === 'crop' && (
        <>
          <p className="mb-3 text-[13px] text-ink-soft">Arraste e use o zoom pra escolher a parte da foto que aparece.</p>
          <div className="relative mb-5 h-[360px] overflow-hidden rounded-2xl border border-line bg-black/5">
            <Cropper
              image={pet.image}
              crop={crop}
              zoom={zoom}
              aspect={getSlotAspect(templateId)}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
            />
          </div>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="mb-6 w-full accent-blue-deep"
            aria-label="Zoom"
          />
          <Button variant="primary" onClick={handleGenerate} className="w-full">
            Gerar imagem →
          </Button>
        </>
      )}

      {stage === 'preview' && (
        <>
          <div className="mb-6 overflow-hidden rounded-2xl border border-line bg-white">
            {loading && <div className="flex h-[360px] items-center justify-center text-ink-soft">Gerando imagem...</div>}
            {error && <div className="flex h-[360px] items-center justify-center px-6 text-terracotta">{error}</div>}
            {!loading && !error && previewUrl && (
              <img src={previewUrl} alt={`Card de compartilhamento de ${pet.name}`} className="w-full" />
            )}
          </div>

          {shareError && <p className="mb-4 text-sm text-terracotta">{shareError}</p>}

          <div className="flex flex-col gap-2.5">
            <Button variant="primary" onClick={handleShare} disabled={loading || !!error}>
              📤 Compartilhar
            </Button>
            <Button variant="ghost" onClick={handleDownload} disabled={loading || !!error}>
              ⬇ Baixar imagem
            </Button>
            <Button variant="ghost" onClick={() => setStage('crop')}>
              ← Ajustar recorte
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
