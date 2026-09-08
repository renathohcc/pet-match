import { useState } from 'react'
import Cropper from 'react-easy-crop'
import Button from './Button'
import { getCroppedImageFile } from '../lib/imageCrop'

/**
 * Modal de recorte de foto de perfil — aberta sempre que o usuário escolhe
 * um novo arquivo de avatar (edição de perfil ou onboarding em /entrar).
 * Recebe `imageSrc` (object URL do arquivo escolhido) e devolve um File
 * já recortado (quadrado, pronto pra exibição circular) via `onCropped`.
 */
function AvatarCropDialog({ imageSrc, onCropped, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)

  async function handleConfirm() {
    if (!croppedAreaPixels) return
    setProcessing(true)
    setError(null)
    try {
      const file = await getCroppedImageFile(imageSrc, croppedAreaPixels)
      onCropped(file)
    } catch {
      setError('Não foi possível recortar a imagem. Tente outra foto.')
      setProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-[420px] rounded-2xl bg-white p-6.5 shadow-[0_20px_40px_rgba(22,50,79,.2)]">
        <h3 className="mb-4 font-display text-lg text-blue-deep">Ajustar foto</h3>

        <div className="relative h-[280px] w-full overflow-hidden rounded-xl bg-neutral-200">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
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
          className="mt-4.5 w-full accent-blue-deep"
          aria-label="Zoom"
        />

        {error && <p className="mt-3 text-[13.5px] text-terracotta">{error}</p>}

        <div className="mt-5 flex justify-end gap-2.5">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={processing}>
            Cancelar
          </Button>
          <Button type="button" variant="primary" onClick={handleConfirm} disabled={processing}>
            {processing ? 'Aplicando...' : 'Usar foto'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default AvatarCropDialog
