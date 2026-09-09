// Admins do site (donos do Adota.THE) — usado só pra liberar ações
// sensíveis no client (esconder/mostrar botões). A validação de verdade
// é sempre no firestore.rules, isso aqui é só UX.
//
// Lista (não um único UID) pra ter redundância: perder o acesso a uma
// conta não pode significar perder toda a moderação. Manter em sincronia
// com adminUids() em firestore.rules.
export const ADMIN_UIDS = [
  'vJwhGPjI6eYVyl7XAfMevNKfJHR2',
]

export function isAdmin(uid) {
  return ADMIN_UIDS.includes(uid)
}
