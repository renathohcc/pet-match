// Admin único do site (dono do PetMatch) — usado só pra liberar ações
// sensíveis no client (esconder/mostrar botões). A validação de verdade
// é sempre no firestore.rules, isso aqui é só UX.
export const ADMIN_UID = 'vJwhGPjI6eYVyl7XAfMevNKfJHR2'

export function isAdmin(uid) {
  return uid === ADMIN_UID
}
