export function getPetUrl(petId) {
  return `${window.location.origin}/pet-match/pet/${petId}`
}

/** Copia texto pra área de transferência, com fallback pra contextos sem Clipboard API. */
export async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  textarea.remove()
}
