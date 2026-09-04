import { doc, getDoc } from 'firebase/firestore'
import { db } from './firebase'

export function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove acentos (combining diacritics)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

function randomSuffix() {
  return Math.random().toString(36).slice(2, 8)
}

/**
 * Gera um ID de documento legível pro pet (ex: "mel-a3f9k2") checando
 * colisão antes de usar — nomes de pet se repetem bastante.
 */
export async function generateUniquePetSlug(name) {
  const base = slugify(name) || 'pet'

  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = `${base}-${randomSuffix()}`
    const snapshot = await getDoc(doc(db, 'pets', candidate))
    if (!snapshot.exists()) return candidate
  }

  return `${base}-${randomSuffix()}-${Date.now().toString(36)}`
}
