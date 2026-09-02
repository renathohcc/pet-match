// Gera uma imagem pronta pra compartilhar (Instagram/Facebook/WhatsApp) a
// partir da foto de capa do pet, já hospedada no Cloudinary. 100% client-side.
import bgPaws from '../assets/share-templates/template-1.png'
import bgBotanical from '../assets/share-templates/template-2.png'
import bgMinimal from '../assets/share-templates/template-3.png'

const DARK_TEXT = {
  kicker: '#C96A44',
  name: '#16324F',
  city: '#5B6470',
  logo: '#16324F',
}

const LIGHT_TEXT = {
  kicker: '#F0A878',
  name: '#FBF6EC',
  city: '#C7D5E1',
  logo: '#FBF6EC',
}

// Nos templates com arte (background != null), a foto do pet é desenhada
// ATRÁS do PNG do template — o PNG já tem um recorte transparente de verdade
// no formato exato da moldura (ver scripts que geraram os arquivos em
// src/assets/share-templates/), então o encaixe nos cantos é sempre perfeito
// não importa o crop escolhido pelo usuário.
export const SHARE_TEMPLATES = [
  {
    id: 'quadrado',
    label: 'Quadrado (clássico)',
    width: 1080,
    height: 1080,
    background: null,
    slot: { x: 0.06, y: 0.06, w: 0.88, h: 0.58 },
    text: DARK_TEXT,
  },
  {
    id: 'story-patinhas',
    label: 'Story · Patinhas',
    width: 1080,
    height: 1920,
    background: bgPaws,
    slot: { x: 0.1019, y: 0.0599, w: 0.7954, h: 0.6198 },
    text: LIGHT_TEXT,
    // Este template tem patinhas decorativas correndo pelas laterais inteiras e um
    // "rabo de fio" no rodapé — texto centralizado e mais alto evita colidir com elas.
    textAlign: 'center',
    logoYRatio: 0.87,
  },
  {
    id: 'story-botanico',
    label: 'Story · Botânico',
    width: 1080,
    height: 1920,
    background: bgBotanical,
    slot: { x: 0.1056, y: 0.0703, w: 0.7907, h: 0.6198 },
    text: DARK_TEXT,
    // Vasinho decorativo no canto inferior esquerdo — desloca só a logo pra direita.
    logoXOffsetRatio: 0.09,
  },
  {
    id: 'story-minimal',
    label: 'Story · Minimalista',
    width: 1080,
    height: 1920,
    background: bgMinimal,
    slot: { x: 0.0944, y: 0.0615, w: 0.8157, h: 0.6010 },
    text: DARK_TEXT,
    // A arte tem uma linha divisória bem perto do rodapé — sobe a logo pra não bater nela.
    logoYRatio: 0.86,
  },
]

export function getTemplate(templateId) {
  return SHARE_TEMPLATES.find((t) => t.id === templateId) ?? SHARE_TEMPLATES[0]
}

/** Proporção (largura/altura) da área da foto — usada como `aspect` do recorte interativo. */
export function getSlotAspect(templateId) {
  const { width, height, slot } = getTemplate(templateId)
  return (slot.w * width) / (slot.h * height)
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

function drawText(ctx, pet, text, textX, photoBottom, width, height, margin, options) {
  const textY = photoBottom + height * 0.07
  const centered = options.textAlign === 'center'
  ctx.textAlign = centered ? 'center' : 'left'
  const x = centered ? width / 2 : textX

  ctx.fillStyle = text.kicker
  ctx.font = `600 ${width * 0.032}px 'Source Sans 3', sans-serif`
  ctx.fillText('ADOÇÃO RESPONSÁVEL', x, textY)

  ctx.fillStyle = text.name
  ctx.font = `600 ${width * 0.085}px 'Fraunces', serif`
  ctx.fillText(pet.name, x, textY + width * 0.09)

  const location = [pet.neighborhood, pet.city].filter(Boolean).join(', ')
  ctx.fillStyle = text.city
  ctx.font = `400 ${width * 0.036}px 'Source Sans 3', sans-serif`
  ctx.fillText(`📍 ${location}`, x, textY + width * 0.135)

  const logoY = options.logoYRatio ? height * options.logoYRatio : height - margin * 0.9
  const logoX = centered ? width / 2 : x + width * (options.logoXOffsetRatio ?? 0)
  ctx.fillStyle = text.logo
  ctx.font = `700 ${width * 0.04}px 'Fraunces', serif`
  ctx.fillText('♡ PetMatch', logoX, logoY)

  ctx.textAlign = 'left'
}

/**
 * @param {{ pet: { name: string, city: string, image: string }, templateId: string, cropRect?: {x:number,y:number,width:number,height:number} }} params
 * @returns {Promise<Blob>}
 */
export async function generateShareImage({ pet, templateId, cropRect }) {
  const template = getTemplate(templateId)
  const { width, height, slot, text } = template

  await document.fonts.ready
  const [img, bg] = await Promise.all([loadImage(pet.image), template.background ? loadImage(template.background) : null])

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  const slotX = slot.x * width
  const slotY = slot.y * height
  const slotW = slot.w * width
  const slotH = slot.h * height

  if (bg) {
    // Foto atrás, template (com o recorte transparente) por cima — o encaixe
    // nos cantos vem 100% do alpha do PNG, não de clipping calculado aqui.
    ctx.fillStyle = '#FBF6EC'
    ctx.fillRect(0, 0, width, height)
    drawPhoto(ctx, img, slotX, slotY, slotW, slotH, cropRect)
    ctx.drawImage(bg, 0, 0, width, height)
  } else {
    ctx.fillStyle = '#FBF6EC'
    ctx.fillRect(0, 0, width, height)
    ctx.save()
    roundRect(ctx, slotX, slotY, slotW, slotH, width * 0.03)
    ctx.clip()
    drawPhoto(ctx, img, slotX, slotY, slotW, slotH, cropRect)
    ctx.restore()
  }

  drawText(ctx, pet, text, slotX, slotY + slotH, width, height, width * 0.06, template)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Falha ao gerar a imagem.'))), 'image/png')
  })
}
