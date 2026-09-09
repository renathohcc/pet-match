/**
 * Validação leve de telefone BR pro campo de WhatsApp do anúncio. Não tenta
 * ser perfeita — só evita que um erro de digitação mande o adotante pra um
 * número inexistente ou de terceiro. A formatação final pra `wa.me` é feita
 * em buildWhatsappHref (PetDetail.jsx).
 */
export function onlyDigits(raw) {
  return (raw || '').replace(/\D/g, '')
}

export function isValidBrPhone(raw) {
  const d = onlyDigits(raw)
  // Aceita: DDD + número (10 ou 11 dígitos) ou com código do país 55 (12–13).
  if (d.length === 10 || d.length === 11) return true
  if ((d.length === 12 || d.length === 13) && d.startsWith('55')) return true
  return false
}
