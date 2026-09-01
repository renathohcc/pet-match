import { useEffect, useState } from 'react'
import Button from './Button'
import Chip from './Chip'
import { generateShareImage, SHARE_TEMPLATES } from '../lib/shareImage'

function ShareCard({ pet, onContinue }) {
  const [templateId, setTemplateId] = useState(SHARE_TEMPLATES[0].id)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [blob, setBlob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [shareError, setShareError] = useState(null)

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- feedback imediato de loading ao trocar template
    setLoading(true)
    setError(null)

    generateShareImage({ pet, templateId })
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `pet` é estável (vem do doc recém-criado)
  }, [templateId])

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
    <div className="mx-auto max-w-[420px] pb-20 pt-9 text-center">
      <div className="mb-2 text-sm font-semibold text-terracotta">Anúncio publicado!</div>
      <h1 className="mb-3 font-display text-2xl text-blue-deep">Compartilhe {pet.name} nas redes</h1>
      <p className="mb-6 text-[14.5px] text-ink-soft">
        Uma imagem prontinha pra postar no Instagram, Facebook ou WhatsApp — mais gente vê, mais rápido{' '}
        {pet.name} encontra um lar.
      </p>

      <div className="mb-5 flex justify-center gap-2">
        {SHARE_TEMPLATES.map((t) => (
          <Chip key={t.id} active={templateId === t.id} onClick={() => setTemplateId(t.id)}>
            {t.label}
          </Chip>
        ))}
      </div>

      <div className="mb-6 overflow-hidden rounded-2xl border border-line bg-white">
        {loading && <div className="flex h-[360px] items-center justify-center text-ink-soft">Gerando imagem...</div>}
        {error && <div className="flex h-[360px] items-center justify-center px-6 text-terracotta">{error}</div>}
        {!loading && !error && previewUrl && <img src={previewUrl} alt={`Card de compartilhamento de ${pet.name}`} className="w-full" />}
      </div>

      {shareError && <p className="mb-4 text-sm text-terracotta">{shareError}</p>}

      <div className="flex flex-col gap-2.5">
        <Button variant="primary" onClick={handleShare} disabled={loading || !!error}>
          📤 Compartilhar
        </Button>
        <Button variant="ghost" onClick={handleDownload} disabled={loading || !!error}>
          ⬇ Baixar imagem
        </Button>
        <Button variant="ghost" onClick={onContinue}>
          Ver meu anúncio →
        </Button>
      </div>
    </div>
  )
}

export default ShareCard
