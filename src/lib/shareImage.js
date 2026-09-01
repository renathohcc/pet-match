// Gera uma imagem pronta pra compartilhar (Instagram/Facebook/WhatsApp) a
// partir da foto de capa do pet, já hospedada no Cloudinary. 100% client-side.

export const SHARE_TEMPLATES = [
  { id: 'quadrado', label: 'Quadrado (feed)', width: 1080, height: 1080 },
  { id: 'story', label: 'Story (vertical)', width: 1080, height: 1920 },
]

const COLORS = {
  blueDeep: '#16324F',
  cream: '#FBF6EC',
  terracotta: '#C96A44',
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Não foi possível carregar a foto do pet.'))
    img.src = url
  })
}

// Desenha `img` cobrindo o retângulo (x, y, w, h), cropando o excesso
// (equivalente a object-fit: cover).
function drawCover(ctx, img, x, y, w, h) {
  const imgRatio = img.width / img.height
  const boxRatio = w / h
  let sx, sy, sw, sh

  if (imgRatio > boxRatio) {
    sh = img.height
    sw = sh * boxRatio
    sx = (img.width - sw) / 2
    sy = 0
  } else {
    sw = img.width
    sh = sw / boxRatio
    sx = 0
    sy = (img.height - sh) / 2
  }

  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/**
 * @param {{ pet: { name: string, city: string, image: string }, templateId: string }} params
 * @returns {Promise<Blob>}
 */
export async function generateShareImage({ pet, templateId }) {
  const template = SHARE_TEMPLATES.find((t) => t.id === templateId) ?? SHARE_TEMPLATES[0]
  const { width, height } = template

  await document.fonts.ready
  const img = await loadImage(pet.image)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  // Fundo
  ctx.fillStyle = COLORS.cream
  ctx.fillRect(0, 0, width, height)

  // Foto do pet, cropada num cartão arredondado com margem
  const margin = width * 0.06
  const photoW = width - margin * 2
  const photoH = height * (templateId === 'story' ? 0.62 : 0.58)
  const photoX = margin
  const photoY = margin

  ctx.save()
  roundRect(ctx, photoX, photoY, photoW, photoH, width * 0.03)
  ctx.clip()
  drawCover(ctx, img, photoX, photoY, photoW, photoH)
  ctx.restore()

  // Faixa inferior com nome/cidade
  const textY = photoY + photoH + height * 0.07
  ctx.fillStyle = COLORS.terracotta
  ctx.font = `600 ${width * 0.032}px 'Source Sans 3', sans-serif`
  ctx.fillText('ADOÇÃO RESPONSÁVEL', photoX, textY)

  ctx.fillStyle = COLORS.blueDeep
  ctx.font = `600 ${width * 0.085}px 'Fraunces', serif`
  ctx.fillText(pet.name, photoX, textY + width * 0.09)

  ctx.fillStyle = '#5B6470'
  ctx.font = `400 ${width * 0.036}px 'Source Sans 3', sans-serif`
  ctx.fillText(`📍 ${pet.city}`, photoX, textY + width * 0.135)

  // Wordmark no rodapé
  const logoY = height - margin * 0.9
  ctx.fillStyle = COLORS.blueDeep
  ctx.font = `700 ${width * 0.04}px 'Fraunces', serif`
  ctx.fillText('♡ PetMatch', photoX, logoY)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Falha ao gerar a imagem.'))), 'image/png')
  })
}
