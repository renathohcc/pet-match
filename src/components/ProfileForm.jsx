import { useState } from 'react'
import Button from './Button'
import AvatarCropDialog from './AvatarCropDialog'
import { TUTOR_TYPES } from '../lib/users'
import { uploadProfilePhoto } from '../lib/cloudinary'

const fieldClass =
  'w-full rounded-[10px] border-[1.4px] border-line bg-white px-3.5 py-3 font-sans text-[15px] text-ink'

/**
 * Formulário de perfil reutilizável — usado tanto na edição em `/perfil`
 * quanto no onboarding pós-login em `/entrar`. Não sabe de navegação nem
 * de `onboarded`; só coleta os dados e chama `onSubmit`.
 */
function ProfileForm({
  initialName = '',
  initialPhotoURL = '',
  initialTutorType = 'independente',
  submitLabel = 'Salvar',
  onSubmit,
  onCancel,
}) {
  const [name, setName] = useState(initialName)
  const [tutorType, setTutorType] = useState(initialTutorType)
  const [photoFile, setPhotoFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [cropSrc, setCropSrc] = useState(null)

  const previewURL = photoFile ? URL.createObjectURL(photoFile) : initialPhotoURL

  function handlePhotoChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setCropSrc(URL.createObjectURL(file))
  }

  function handleCropped(croppedFile) {
    setPhotoFile(croppedFile)
    setCropSrc(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const photoURL = photoFile ? await uploadProfilePhoto(photoFile) : initialPhotoURL
      await onSubmit({ displayName: name, tutorType, photoURL })
    } catch {
      setError('Não foi possível salvar as alterações agora. Tente novamente.')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-5 flex items-center gap-4">
        {previewURL ? (
          <img src={previewURL} alt="" className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-mid text-xl font-semibold text-white">
            {(name || 'U')[0]}
          </span>
        )}
        <label className="cursor-pointer text-[13.5px] font-semibold text-blue-mid">
          Trocar foto
          <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
        </label>
      </div>

      <div className="mb-4">
        <label className="mb-1.5 block text-[13.5px] font-semibold text-ink">Nome de exibição</label>
        <input className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div className="mb-6">
        <label className="mb-1.5 block text-[13.5px] font-semibold text-ink">Você é...</label>
        <div className="flex flex-wrap gap-2.5">
          {Object.entries(TUTOR_TYPES).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTutorType(value)}
              className={`cursor-pointer rounded-full border-[1.4px] px-4.5 py-2.5 text-sm font-medium transition-colors ${
                tutorType === value
                  ? 'border-blue-deep bg-blue-deep text-cream'
                  : 'border-line bg-white text-ink-soft hover:border-blue-deep hover:text-blue-deep'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-terracotta">{error}</p>}

      <div className="flex justify-end gap-2.5">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
        )}
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? 'Salvando...' : submitLabel}
        </Button>
      </div>

      {cropSrc && (
        <AvatarCropDialog imageSrc={cropSrc} onCropped={handleCropped} onCancel={() => setCropSrc(null)} />
      )}
    </form>
  )
}

export default ProfileForm
