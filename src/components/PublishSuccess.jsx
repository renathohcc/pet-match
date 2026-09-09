import { useState } from 'react'
import Button from './Button'
import { copyToClipboard, getPetUrl } from '../lib/shareLink'

/**
 * Tela logo depois de publicar um anúncio — só as 3 opções (copiar link,
 * gerar imagem de compartilhar, seguir pro anúncio), sem forçar quem só quer
 * o link a passar pelo fluxo de recorte/formato do `ShareCard`.
 */
function PublishSuccess({ pet, onGenerateImage, onContinue }) {
  const [linkCopied, setLinkCopied] = useState(false)
  const [error, setError] = useState(null)

  async function handleCopyLink() {
    const url = getPetUrl(pet.id)
    try {
      await copyToClipboard(url)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch {
      setError('Não foi possível copiar o link. Copie manualmente: ' + url)
    }
  }

  return (
    <div className="mx-auto max-w-[420px] py-12 text-center">
      <div className="mb-2 text-sm font-semibold text-terracotta">Anúncio publicado!</div>
      <h1 className="mb-3 font-display text-2xl text-blue-deep">{pet.name} já está no ar 🎉</h1>
      <p className="mb-8 text-[14.5px] text-ink-soft">
        Quanto mais gente ver, mais rápido {pet.name} encontra um lar. O que você quer fazer agora?
      </p>

      <div className="flex flex-col gap-2.5">
        <Button variant="ghost" onClick={handleCopyLink}>
          {linkCopied ? '🔗 Link copiado!' : '🔗 Copiar link do anúncio'}
        </Button>
        <Button variant="primary" onClick={onGenerateImage}>
          🖼️ Gerar imagem para compartilhar
        </Button>
        <Button variant="ghost" onClick={onContinue}>
          Seguir para o anúncio →
        </Button>
      </div>

      {error && <p className="mt-4 text-sm text-terracotta">{error}</p>}
    </div>
  )
}

export default PublishSuccess
