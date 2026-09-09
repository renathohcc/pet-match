// Script local, dev-only: popula o Firestore com os pets mockados usando o
// Admin SDK (ignora as Security Rules — nunca roda no app/no browser).
// Uso: npm run seed
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { initializeApp, cert, applicationDefault } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { mockPets } from '../src/data/mockPets.js'

// A chave de service account NUNCA deve ficar dentro do repositório nem numa
// pasta sincronizada (OneDrive/Drive) — ela ignora todas as Security Rules.
// Prefira apontar GOOGLE_APPLICATION_CREDENTIALS para um caminho fora do
// projeto (ex: %USERPROFILE%\.secrets\adota-the-admin.json). O fallback pro
// arquivo local em scripts/ continua funcionando (segue no .gitignore), mas
// é o caminho menos seguro.
function loadCredential() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return applicationDefault()
  }
  const keyPath = fileURLToPath(new URL('./serviceAccountKey.json', import.meta.url))
  try {
    return cert(JSON.parse(readFileSync(keyPath, 'utf-8')))
  } catch {
    console.error(
      'Credencial de admin não encontrada.\n' +
        'Opção recomendada: defina GOOGLE_APPLICATION_CREDENTIALS apontando para a\n' +
        'chave salva FORA do projeto (nunca em pasta sincronizada).\n' +
        'Gere em: Firebase Console > Configurações do projeto > Contas de serviço > Gerar nova chave privada.'
    )
    process.exit(1)
  }
}

initializeApp({ credential: loadCredential() })
const db = getFirestore()

async function seed() {
  const batch = db.batch()
  for (const pet of mockPets) {
    const ref = db.collection('pets').doc(pet.id)
    batch.set(ref, {
      ...pet,
      status: 'disponivel',
      donorId: 'seed-donor',
      createdAt: FieldValue.serverTimestamp(),
    })
  }
  await batch.commit()
  console.log(`${mockPets.length} pets gravados no Firestore.`)
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
