// Gera uma imagem pronta pra compartilhar (Instagram/Facebook/WhatsApp) a
// partir da foto de capa do pet, já hospedada no Cloudinary. 100% client-side.
// Sem arte de fundo — só o card/story desenhado por código, com opções de cor.

export const SHARE_FORMATS = [
  { id: 'quadrado', label: 'Quadrado', width: 1080, height: 1080 },
  { id: 'story', label: 'Story', width: 1080, height: 1920 },
]

export const COLOR_THEMES = [
  {
    id: 'creme',
    label: 'Creme',
    bg: '#FBF6EC',
    text: { kicker: '#C96A44', name: '#16324F', city: '#5B6470', logo: '#16324F' },
  },
  {
    id: 'azul',
    label: 'Azul petróleo',
    bg: '#16324F',
    text: { kicker: '#F0A878', name: '#FBF6EC', city: '#C7D5E1', logo: '#FBF6EC' },
  },
  {
    id: 'terracota',
    label: 'Terracota',
    bg: '#C96A44',
    text: { kicker: '#FBF6EC', name: '#FBF6EC', city: '#F8E4DA', logo: '#FBF6EC' },
  },
]

const SLOT = { x: 0.06, y: 0.06, w: 0.88, h: 0.58 }

export function getFormat(formatId) {
  return SHARE_FORMATS.find((f) => f.id === formatId) ?? SHARE_FORMATS[0]
}

export function getTheme(themeId) {
  return COLOR_THEMES.find((t) => t.id === themeId) ?? COLOR_THEMES[0]
}

/** Proporção (largura/altura) da área da foto — usada como `aspect` do recorte interativo. */
export function getSlotAspect(formatId) {
  const { width, height } = getFormat(formatId)
  return (SLOT.w * width) / (SLOT.h * height)
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Não foi possível carregar a imagem.'))
    img.src = url
  })
}

// Desenha `img` cobrindo o retângulo de destino (x, y, w, h).
// Se `cropRect` for passado (em pixels naturais da imagem original, formato
// do react-easy-crop), desenha exatamente essa região — é o recorte escolhido
// manualmente pelo usuário. Sem `cropRect`, cai num "cover" automático centralizado.
function drawPhoto(ctx, img, x, y, w, h, cropRect) {
  if (cropRect) {
    ctx.drawImage(img, cropRect.x, cropRect.y, cropRect.width, cropRect.height, x, y, w, h)
    return
  }

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

function drawText(ctx, pet, text, textX, photoBottom, width, height, margin) {
  const textY = photoBottom + height * 0.07

  ctx.fillStyle = text.kicker
  ctx.font = `600 ${width * 0.032}px 'Source Sans 3', sans-serif`
  ctx.fillText('ADOÇÃO RESPONSÁVEL', textX, textY)

  ctx.fillStyle = text.name
  ctx.font = `600 ${width * 0.085}px 'Fraunces', serif`
  ctx.fillText(pet.name, textX, textY + width * 0.09)

  const location = [pet.neighborhood, pet.city].filter(Boolean).join(', ')
  ctx.fillStyle = text.city
  ctx.font = `400 ${width * 0.036}px 'Source Sans 3', sans-serif`
  ctx.fillText(`📍 ${location}`, textX, textY + width * 0.135)

  ctx.fillStyle = text.logo
  ctx.font = `700 ${width * 0.04}px 'Fraunces', serif`
  ctx.fillText('♡ PetMatch', textX, height - margin * 0.9)
}

/**
 * @param {{ pet: { name: string, city: string, neighborhood?: string, image: string }, formatId: string, themeId: string, cropRect?: {x:number,y:number,width:number,height:number} }} params
 * @returns {Promise<Blob>}
 */
export async function generateShareImage({ pet, formatId, themeId, cropRect }) {
  const { width, height } = getFormat(formatId)
  const theme = getTheme(themeId)

  await document.fonts.ready
  const img = await loadImage(pet.image)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  const slotX = SLOT.x * width
  const slotY = SLOT.y * height
  const slotW = SLOT.w * width
  const slotH = SLOT.h * height
  const margin = width * 0.06

  ctx.fillStyle = theme.bg
  ctx.fillRect(0, 0, width, height)

  ctx.save()
  roundRect(ctx, slotX, slotY, slotW, slotH, width * 0.03)
  ctx.clip()
  drawPhoto(ctx, img, slotX, slotY, slotW, slotH, cropRect)
  ctx.restore()

  drawText(ctx, pet, theme.text, slotX, slotY + slotH, width, height, margin)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Falha ao gerar a imagem.'))), 'image/png')
  })
}
