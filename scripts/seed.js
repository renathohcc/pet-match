// Script local, dev-only: popula o Firestore com os pets mockados usando o
// Admin SDK (ignora as Security Rules — nunca roda no app/no browser).
// Uso: npm run seed
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import admin from 'firebase-admin'
import { mockPets } from '../src/data/mockPets.js'

const keyPath = fileURLToPath(new URL('./serviceAccountKey.json', import.meta.url))

let serviceAccount
try {
  serviceAccount = JSON.parse(readFileSync(keyPath, 'utf-8'))
} catch {
  console.error(
    'scripts/serviceAccountKey.json não encontrado.\n' +
      'Gere em: Firebase Console > Configurações do projeto > Contas de serviço > Gerar nova chave privada.\n' +
      'Salve o arquivo em scripts/serviceAccountKey.json (já está no .gitignore, nunca commitar).'
  )
  process.exit(1)
}

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
const db = admin.firestore()

async function seed() {
  const batch = db.batch()
  for (const pet of mockPets) {
    const ref = db.collection('pets').doc(pet.id)
    batch.set(ref, {
      ...pet,
      status: 'disponivel',
      donorId: 'seed-donor',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
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
