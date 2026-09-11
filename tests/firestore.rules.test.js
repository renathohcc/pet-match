// Testes das Security Rules contra o emulador do Firestore. Rodar com
// `npm run test:rules` (sobe o emulador, roda a suíte, derruba o emulador).
// Cobre os invariantes críticos de cada coleção — não é exaustivo campo a
// campo, é rede de segurança pra mudança futura em firestore.rules não
// quebrar silenciosamente o que já foi endurecido nas fases S1-S4.
import { readFileSync } from 'node:fs'
import { afterAll, afterEach, beforeAll, describe, it } from 'vitest'
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'

const DONOR = 'donor-uid-000000000000000001'
const ADOPTER = 'adopter-uid-00000000000000001'
const OTHER = 'other-uid-0000000000000000001'
const ADMIN = 'vJwhGPjI6eYVyl7XAfMevNKfJHR2' // 1º UID admin em firestore.rules

let testEnv

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-adota-the',
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  })
})

afterAll(async () => {
  await testEnv.cleanup()
})

afterEach(async () => {
  await testEnv.clearFirestore()
})

function dbAs(uid) {
  return (uid ? testEnv.authenticatedContext(uid) : testEnv.unauthenticatedContext()).firestore()
}

async function seed(fn) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => fn(ctx.firestore()))
}

function validPet(overrides = {}) {
  return {
    name: 'Rex',
    species: 'cão',
    size: 'Médio',
    sex: 'Macho',
    city: 'Teresina',
    status: 'disponivel',
    donorId: DONOR,
    createdAt: serverTimestamp(),
    age: 'Adulto (6 meses a 7 anos)',
    breed: 'SRD',
    story: '',
    health: [],
    temperament: [],
    neighborhood: 'Centro',
    image: '',
    thumbs: [],
    contactName: 'Doador',
    contactType: 'Tutor(a) independente',
    ...overrides,
  }
}

/** Cria o pet já carimbando o rate limit no mesmo batch (o create de verdade exige isso). */
async function createPetAs(uid, petId, overrides = {}) {
  const db = dbAs(uid)
  const batch = writeBatch(db)
  batch.set(doc(db, 'rateLimits', uid), { petAt: serverTimestamp() }, { merge: true })
  batch.set(doc(db, 'pets', petId), validPet({ donorId: uid, ...overrides }))
  return batch.commit()
}

function validUser(overrides = {}) {
  return { displayName: 'Fulano', tutorType: 'independente', ...overrides }
}

describe('pets', () => {
  it('leitura é pública mesmo sem login', async () => {
    await seed((db) => setDoc(doc(db, 'pets', 'p1'), validPet()))
    await assertSucceeds(getDoc(doc(dbAs(null), 'pets', 'p1')))
  })

  it('create sem rate limit stampado no mesmo batch é negado', async () => {
    await assertFails(setDoc(doc(dbAs(DONOR), 'pets', 'p1'), validPet()))
  })

  it('create válido, com rate limit no batch, é aceito', async () => {
    await assertSucceeds(createPetAs(DONOR, 'p1'))
  })

  it('create com donorId de outra pessoa é negado', async () => {
    const db = dbAs(DONOR)
    const batch = writeBatch(db)
    batch.set(doc(db, 'rateLimits', DONOR), { petAt: serverTimestamp() }, { merge: true })
    batch.set(doc(db, 'pets', 'p1'), validPet({ donorId: OTHER }))
    await assertFails(batch.commit())
  })

  it('create com adopterId já presente é negado', async () => {
    await assertFails(createPetAs(DONOR, 'p1', { adopterId: DONOR }))
  })

  it('create com reportCount != 0 é negado', async () => {
    await assertFails(createPetAs(DONOR, 'p1', { reportCount: 3 }))
  })

  it('create com image fora do nosso Cloudinary é negado', async () => {
    await assertFails(createPetAs(DONOR, 'p1', { image: 'https://evil.example.com/x.jpg' }))
  })

  it('create com image do nosso Cloudinary é aceito', async () => {
    await assertSucceeds(
      createPetAs(DONOR, 'p1', { image: 'https://res.cloudinary.com/gmhrbocv/image/upload/v1/pets/x.jpg' })
    )
  })

  it('quem não é dono não pode editar o anúncio', async () => {
    await seed((db) => setDoc(doc(db, 'pets', 'p1'), validPet()))
    await assertFails(updateDoc(doc(dbAs(OTHER), 'pets', 'p1'), { name: 'Hackeado' }))
  })

  it('dono pode editar o próprio anúncio (shape válido)', async () => {
    await seed((db) => setDoc(doc(db, 'pets', 'p1'), validPet()))
    await assertSucceeds(updateDoc(doc(dbAs(DONOR), 'pets', 'p1'), validPet({ name: 'Rex II' })))
  })

  it('autoatendimento de adoção exige interesse confirmado', async () => {
    await seed((db) => setDoc(doc(db, 'pets', 'p1'), validPet()))
    await assertFails(
      updateDoc(doc(dbAs(ADOPTER), 'pets', 'p1'), { status: 'adotado', adopterId: ADOPTER })
    )

    await seed((db) =>
      setDoc(doc(db, 'interests', `p1_${ADOPTER}`), {
        petId: 'p1',
        userId: ADOPTER,
        donorId: DONOR,
        status: 'confirmado',
        message: '',
        createdAt: serverTimestamp(),
      })
    )
    await assertSucceeds(
      updateDoc(doc(dbAs(ADOPTER), 'pets', 'p1'), { status: 'adotado', adopterId: ADOPTER })
    )
  })

  it('incrementar reportCount exige a denúncia correspondente no mesmo batch', async () => {
    await seed((db) => setDoc(doc(db, 'pets', 'p1'), validPet()))

    // sem a denúncia junto: negado
    await assertFails(updateDoc(doc(dbAs(OTHER), 'pets', 'p1'), { reportCount: 1 }))

    // com a denúncia + rate limit no mesmo batch: aceito
    const db = dbAs(OTHER)
    const batch = writeBatch(db)
    batch.set(doc(db, 'rateLimits', OTHER), { reportAt: serverTimestamp() }, { merge: true })
    batch.set(doc(db, 'reports', `p1__${OTHER}`), {
      petId: 'p1',
      petName: 'Rex',
      reportedBy: OTHER,
      reason: 'fraude',
      details: '',
      status: 'aberta',
      createdAt: serverTimestamp(),
    })
    batch.update(doc(db, 'pets', 'p1'), { reportCount: 1 })
    await assertSucceeds(batch.commit())
  })

  it('admin restaura visibilidade zerando reportCount', async () => {
    await seed((db) => setDoc(doc(db, 'pets', 'p1'), validPet({ reportCount: 5 })))
    await assertSucceeds(updateDoc(doc(dbAs(ADMIN), 'pets', 'p1'), { reportCount: 0 }))
  })

  it('não-admin não pode zerar reportCount de qualquer forma', async () => {
    await seed((db) => setDoc(doc(db, 'pets', 'p1'), validPet({ reportCount: 5 })))
    await assertFails(updateDoc(doc(dbAs(OTHER), 'pets', 'p1'), { reportCount: 0 }))
  })

  it('dono não apaga pet já adotado; admin apaga', async () => {
    await seed((db) => setDoc(doc(db, 'pets', 'p1'), validPet({ status: 'adotado' })))
    await assertFails(deleteDoc(doc(dbAs(DONOR), 'pets', 'p1')))
    await assertSucceeds(deleteDoc(doc(dbAs(ADMIN), 'pets', 'p1')))
  })

  it('dono apaga pet disponível', async () => {
    await seed((db) => setDoc(doc(db, 'pets', 'p1'), validPet()))
    await assertSucceeds(deleteDoc(doc(dbAs(DONOR), 'pets', 'p1')))
  })
})

describe('rateLimits', () => {
  it('primeiro carimbo (create) é livre', async () => {
    await assertSucceeds(setDoc(doc(dbAs(DONOR), 'rateLimits', DONOR), { petAt: serverTimestamp() }))
  })

  it('outro uid não pode gravar o rateLimits de alguém', async () => {
    await assertFails(setDoc(doc(dbAs(OTHER), 'rateLimits', DONOR), { petAt: serverTimestamp() }))
  })

  it('recarimbar antes do intervalo mínimo é negado', async () => {
    await seed((db) => setDoc(doc(db, 'rateLimits', DONOR), { petAt: Timestamp.now() }))
    await assertFails(setDoc(doc(dbAs(DONOR), 'rateLimits', DONOR), { petAt: serverTimestamp() }, { merge: true }))
  })

  it('recarimbar depois do intervalo mínimo é aceito', async () => {
    const past = Timestamp.fromMillis(Date.now() - 46_000)
    await seed((db) => setDoc(doc(db, 'rateLimits', DONOR), { petAt: past }))
    await assertSucceeds(setDoc(doc(dbAs(DONOR), 'rateLimits', DONOR), { petAt: serverTimestamp() }, { merge: true }))
  })

  it('no primeiro write (create) as 3 chaves de uma vez são ok — a restrição de 1 por vez é só no update', async () => {
    await assertSucceeds(
      setDoc(doc(dbAs(DONOR), 'rateLimits', DONOR), { petAt: serverTimestamp(), reportAt: serverTimestamp() })
    )
  })

  it('depois de existir, não dá pra mexer em duas chaves no mesmo update', async () => {
    await seed((db) => setDoc(doc(db, 'rateLimits', DONOR), { petAt: Timestamp.fromMillis(Date.now() - 46_000) }))
    await assertFails(
      updateDoc(doc(dbAs(DONOR), 'rateLimits', DONOR), { petAt: serverTimestamp(), reportAt: serverTimestamp() })
    )
  })
})

describe('users', () => {
  it('get de perfil é público', async () => {
    await seed((db) => setDoc(doc(db, 'users', DONOR), validUser()))
    await assertSucceeds(getDoc(doc(dbAs(null), 'users', DONOR)))
  })

  it('list da coleção inteira só admin', async () => {
    await assertFails(getDocs(collection(dbAs(OTHER), 'users')))
    await assertFails(getDocs(collection(dbAs(null), 'users')))
    await assertSucceeds(getDocs(collection(dbAs(ADMIN), 'users')))
  })

  it('create do próprio doc com shape válida é aceito', async () => {
    await assertSucceeds(setDoc(doc(dbAs(DONOR), 'users', DONOR), validUser()))
  })

  it('create com campo desconhecido é negado', async () => {
    await assertFails(setDoc(doc(dbAs(DONOR), 'users', DONOR), validUser({ isAdmin: true })))
  })

  it('não dá pra criar/editar o doc de outra pessoa', async () => {
    await assertFails(setDoc(doc(dbAs(DONOR), 'users', OTHER), validUser()))
  })

  it('favoritePetIds é uma chave permitida (regressão: quebrou em prod na S1)', async () => {
    await seed((db) => setDoc(doc(db, 'users', DONOR), validUser()))
    await assertSucceeds(
      updateDoc(doc(dbAs(DONOR), 'users', DONOR), { favoritePetIds: ['p1', 'p2'] })
    )
  })

  it('acceptedTermsAt precisa ser timestamp', async () => {
    await seed((db) => setDoc(doc(db, 'users', DONOR), validUser()))
    await assertFails(updateDoc(doc(dbAs(DONOR), 'users', DONOR), { acceptedTermsAt: 'agora' }))
    await assertSucceeds(updateDoc(doc(dbAs(DONOR), 'users', DONOR), { acceptedTermsAt: serverTimestamp() }))
  })

  it('exclusão de conta: a própria pessoa apaga o próprio doc; ninguém mais', async () => {
    await seed((db) => setDoc(doc(db, 'users', DONOR), validUser()))
    await assertFails(deleteDoc(doc(dbAs(OTHER), 'users', DONOR)))
    await assertSucceeds(deleteDoc(doc(dbAs(DONOR), 'users', DONOR)))
  })
})

describe('interests', () => {
  async function seedPet(petId = 'p1') {
    await seed((db) => setDoc(doc(db, 'pets', petId), validPet()))
  }

  it('create exige rate limit no batch e donorId batendo com o pet', async () => {
    await seedPet()
    const db = dbAs(ADOPTER)
    await assertFails(
      setDoc(doc(db, 'interests', `p1_${ADOPTER}`), {
        petId: 'p1', userId: ADOPTER, donorId: DONOR, status: 'pendente', message: '', createdAt: serverTimestamp(),
      })
    )

    const batch = writeBatch(db)
    batch.set(doc(db, 'rateLimits', ADOPTER), { interestAt: serverTimestamp() }, { merge: true })
    batch.set(doc(db, 'interests', `p1_${ADOPTER}`), {
      petId: 'p1', userId: ADOPTER, donorId: DONOR, status: 'pendente', message: '', createdAt: serverTimestamp(),
    })
    await assertSucceeds(batch.commit())
  })

  it('só o doador ou o próprio interessado conseguem ler o pedido', async () => {
    await seedPet()
    await seed((db) =>
      setDoc(doc(db, 'interests', `p1_${ADOPTER}`), {
        petId: 'p1', userId: ADOPTER, donorId: DONOR, status: 'pendente', message: '', createdAt: serverTimestamp(),
      })
    )
    await assertSucceeds(getDoc(doc(dbAs(DONOR), 'interests', `p1_${ADOPTER}`)))
    await assertSucceeds(getDoc(doc(dbAs(ADOPTER), 'interests', `p1_${ADOPTER}`)))
    await assertFails(getDoc(doc(dbAs(OTHER), 'interests', `p1_${ADOPTER}`)))
  })

  it('doador aceita; só a pessoa escolhida confirma depois', async () => {
    await seedPet()
    await seed((db) =>
      setDoc(doc(db, 'interests', `p1_${ADOPTER}`), {
        petId: 'p1', userId: ADOPTER, donorId: DONOR, status: 'pendente', message: '', createdAt: serverTimestamp(),
      })
    )
    await assertSucceeds(updateDoc(doc(dbAs(DONOR), 'interests', `p1_${ADOPTER}`), { status: 'aceito' }))
    await assertSucceeds(updateDoc(doc(dbAs(DONOR), 'interests', `p1_${ADOPTER}`), { status: 'confirmacao_pendente' }))
    await assertFails(updateDoc(doc(dbAs(DONOR), 'interests', `p1_${ADOPTER}`), { status: 'confirmado' }))
    await assertSucceeds(updateDoc(doc(dbAs(ADOPTER), 'interests', `p1_${ADOPTER}`), { status: 'confirmado' }))
  })

  it('a pessoa apaga o próprio pedido; o doador apaga pedidos no anúncio dele', async () => {
    await seedPet()
    await seed((db) =>
      setDoc(doc(db, 'interests', `p1_${ADOPTER}`), {
        petId: 'p1', userId: ADOPTER, donorId: DONOR, status: 'pendente', message: '', createdAt: serverTimestamp(),
      })
    )
    await assertFails(deleteDoc(doc(dbAs(OTHER), 'interests', `p1_${ADOPTER}`)))
    await assertSucceeds(deleteDoc(doc(dbAs(DONOR), 'interests', `p1_${ADOPTER}`)))
  })
})

describe('petContacts', () => {
  async function seedPetAndInterest(status) {
    await seed(async (db) => {
      await setDoc(doc(db, 'pets', 'p1'), validPet())
      await setDoc(doc(db, 'petContacts', 'p1'), { whatsapp: '86999990000', donorId: DONOR })
      if (status) {
        await setDoc(doc(db, 'interests', `p1_${ADOPTER}`), {
          petId: 'p1', userId: ADOPTER, donorId: DONOR, status, message: '', createdAt: serverTimestamp(),
        })
      }
    })
  }

  it('sem interesse aceito, o adotante não lê o contato', async () => {
    await seedPetAndInterest('pendente')
    await assertFails(getDoc(doc(dbAs(ADOPTER), 'petContacts', 'p1')))
  })

  it('interesse aceito libera a leitura do contato', async () => {
    await seedPetAndInterest('aceito')
    await assertSucceeds(getDoc(doc(dbAs(ADOPTER), 'petContacts', 'p1')))
  })

  it('doador sempre lê o próprio contato', async () => {
    await seedPetAndInterest()
    await assertSucceeds(getDoc(doc(dbAs(DONOR), 'petContacts', 'p1')))
  })

  it('whatsapp curto demais é negado', async () => {
    await seed((db) => setDoc(doc(db, 'pets', 'p1'), validPet()))
    await assertFails(setDoc(doc(dbAs(DONOR), 'petContacts', 'p1'), { whatsapp: '123', donorId: DONOR }))
  })

  it('só o doador cria/edita o próprio contato', async () => {
    await seed((db) => setDoc(doc(db, 'pets', 'p1'), validPet()))
    await assertFails(setDoc(doc(dbAs(OTHER), 'petContacts', 'p1'), { whatsapp: '86999990000', donorId: OTHER }))
    await assertSucceeds(setDoc(doc(dbAs(DONOR), 'petContacts', 'p1'), { whatsapp: '86999990000', donorId: DONOR }))
  })
})

describe('reviews', () => {
  async function seedAdoptedPet() {
    await seed((db) => setDoc(doc(db, 'pets', 'p1'), validPet({ status: 'adotado', adopterId: ADOPTER })))
  }

  it('get de uma avaliação é público', async () => {
    await seed((db) =>
      setDoc(doc(db, 'reviews', 'p1_adopter_to_donor'), {
        petId: 'p1', fromUserId: ADOPTER, toUserId: DONOR, direction: 'adopter_to_donor',
        rating: 5, comment: 'ótimo', survey: { correspondeuAnuncio: 'sim', jaTinhaPet: 'não', experiencia: 'boa' },
        createdAt: serverTimestamp(),
      })
    )
    await assertSucceeds(getDoc(doc(dbAs(null), 'reviews', 'p1_adopter_to_donor')))
  })

  it('list sem limite é só admin; com limit<=200 é público', async () => {
    await assertFails(getDocs(collection(dbAs(null), 'reviews')))
    await assertSucceeds(getDocs(query(collection(dbAs(null), 'reviews'), limit(50))))
    await assertSucceeds(getDocs(collection(dbAs(ADMIN), 'reviews')))
  })

  it('create exige o par real doador/adotante do pet', async () => {
    await seedAdoptedPet()
    await assertFails(
      setDoc(doc(dbAs(OTHER), 'reviews', 'p1_adopter_to_donor'), {
        petId: 'p1', fromUserId: OTHER, toUserId: DONOR, direction: 'adopter_to_donor',
        rating: 5, comment: '', survey: { correspondeuAnuncio: 'sim', jaTinhaPet: 'não', experiencia: 'boa' },
        createdAt: serverTimestamp(),
      })
    )
    await assertSucceeds(
      setDoc(doc(dbAs(ADOPTER), 'reviews', 'p1_adopter_to_donor'), {
        petId: 'p1', fromUserId: ADOPTER, toUserId: DONOR, direction: 'adopter_to_donor',
        rating: 5, comment: '', survey: { correspondeuAnuncio: 'sim', jaTinhaPet: 'não', experiencia: 'boa' },
        createdAt: serverTimestamp(),
      })
    )
  })

  it('só a pessoa avaliada liga underDispute, e só admin desliga', async () => {
    await seed((db) =>
      setDoc(doc(db, 'reviews', 'p1_adopter_to_donor'), {
        petId: 'p1', fromUserId: ADOPTER, toUserId: DONOR, direction: 'adopter_to_donor',
        rating: 5, comment: 'x', survey: {}, createdAt: serverTimestamp(),
      })
    )
    await assertFails(updateDoc(doc(dbAs(ADOPTER), 'reviews', 'p1_adopter_to_donor'), { underDispute: true }))
    await assertSucceeds(updateDoc(doc(dbAs(DONOR), 'reviews', 'p1_adopter_to_donor'), { underDispute: true }))
    await assertFails(updateDoc(doc(dbAs(DONOR), 'reviews', 'p1_adopter_to_donor'), { underDispute: false }))
    await assertSucceeds(updateDoc(doc(dbAs(ADMIN), 'reviews', 'p1_adopter_to_donor'), { underDispute: false }))
  })

  it('nota e comentário são imutáveis', async () => {
    await seed((db) =>
      setDoc(doc(db, 'reviews', 'p1_adopter_to_donor'), {
        petId: 'p1', fromUserId: ADOPTER, toUserId: DONOR, direction: 'adopter_to_donor',
        rating: 5, comment: 'x', survey: {}, createdAt: serverTimestamp(),
      })
    )
    await assertFails(updateDoc(doc(dbAs(ADMIN), 'reviews', 'p1_adopter_to_donor'), { rating: 1 }))
  })
})

describe('reviewDisputes', () => {
  async function seedReview() {
    await seed((db) =>
      setDoc(doc(db, 'reviews', 'p1_adopter_to_donor'), {
        petId: 'p1', fromUserId: ADOPTER, toUserId: DONOR, direction: 'adopter_to_donor',
        rating: 1, comment: 'injusto', survey: {}, createdAt: serverTimestamp(),
      })
    )
  }

  it('só quem recebeu a avaliação pode abrir recurso', async () => {
    await seedReview()
    await assertFails(
      setDoc(doc(dbAs(ADOPTER), 'reviewDisputes', 'p1_adopter_to_donor'), {
        petId: 'p1', direction: 'adopter_to_donor', disputedBy: ADOPTER, reason: 'mentira',
        fromUserId: ADOPTER, toUserId: DONOR, rating: 1, comment: 'injusto', createdAt: serverTimestamp(),
      })
    )
    await assertSucceeds(
      setDoc(doc(dbAs(DONOR), 'reviewDisputes', 'p1_adopter_to_donor'), {
        petId: 'p1', direction: 'adopter_to_donor', disputedBy: DONOR, reason: 'não é verdade',
        fromUserId: ADOPTER, toUserId: DONOR, rating: 1, comment: 'injusto', createdAt: serverTimestamp(),
      })
    )
  })

  it('leitura restrita: admin e as duas pessoas envolvidas, ninguém mais', async () => {
    await seedReview()
    await seed((db) =>
      setDoc(doc(db, 'reviewDisputes', 'p1_adopter_to_donor'), {
        petId: 'p1', direction: 'adopter_to_donor', disputedBy: DONOR, reason: 'não é verdade',
        fromUserId: ADOPTER, toUserId: DONOR, rating: 1, comment: 'injusto', createdAt: serverTimestamp(),
      })
    )
    await assertSucceeds(getDoc(doc(dbAs(DONOR), 'reviewDisputes', 'p1_adopter_to_donor')))
    await assertSucceeds(getDoc(doc(dbAs(ADOPTER), 'reviewDisputes', 'p1_adopter_to_donor')))
    await assertSucceeds(getDoc(doc(dbAs(ADMIN), 'reviewDisputes', 'p1_adopter_to_donor')))
    await assertFails(getDoc(doc(dbAs(OTHER), 'reviewDisputes', 'p1_adopter_to_donor')))
  })
})

describe('reports', () => {
  it('create exige rate limit no batch e motivo válido', async () => {
    const db = dbAs(OTHER)
    await assertFails(
      setDoc(doc(db, 'reports', `p1__${OTHER}`), {
        petId: 'p1', petName: 'Rex', reportedBy: OTHER, reason: 'fraude', details: '', status: 'aberta', createdAt: serverTimestamp(),
      })
    )

    const batch = writeBatch(db)
    batch.set(doc(db, 'rateLimits', OTHER), { reportAt: serverTimestamp() }, { merge: true })
    batch.set(doc(db, 'reports', `p1__${OTHER}`), {
      petId: 'p1', petName: 'Rex', reportedBy: OTHER, reason: 'fraude', details: '', status: 'aberta', createdAt: serverTimestamp(),
    })
    await assertSucceeds(batch.commit())
  })

  it('reason fora da lista é negado', async () => {
    const db = dbAs(OTHER)
    const batch = writeBatch(db)
    batch.set(doc(db, 'rateLimits', OTHER), { reportAt: serverTimestamp() }, { merge: true })
    batch.set(doc(db, 'reports', `p1__${OTHER}`), {
      petId: 'p1', petName: 'Rex', reportedBy: OTHER, reason: 'motivo-qualquer', details: '', status: 'aberta', createdAt: serverTimestamp(),
    })
    await assertFails(batch.commit())
  })

  it('get do próprio doc (pelo sufixo __uid) funciona mesmo sem existir; de outra pessoa, não', async () => {
    await assertSucceeds(getDoc(doc(dbAs(OTHER), 'reports', `p1__${OTHER}`)))
    await assertFails(getDoc(doc(dbAs(OTHER), 'reports', `p1__${ADOPTER}`)))
  })

  it('list só admin', async () => {
    await assertFails(getDocs(collection(dbAs(OTHER), 'reports')))
    await assertSucceeds(getDocs(collection(dbAs(ADMIN), 'reports')))
  })

  it('resolver é só admin, e só nos campos de status', async () => {
    await seed((db) =>
      setDoc(doc(db, 'reports', `p1__${OTHER}`), {
        petId: 'p1', petName: 'Rex', reportedBy: OTHER, reason: 'fraude', details: '', status: 'aberta', createdAt: serverTimestamp(),
      })
    )
    await assertFails(updateDoc(doc(dbAs(OTHER), 'reports', `p1__${OTHER}`), { status: 'resolvida' }))
    await assertFails(updateDoc(doc(dbAs(ADMIN), 'reports', `p1__${OTHER}`), { reason: 'outro' }))
    await assertSucceeds(
      updateDoc(doc(dbAs(ADMIN), 'reports', `p1__${OTHER}`), {
        status: 'resolvida', resolvedBy: ADMIN, resolvedAt: serverTimestamp(),
      })
    )
  })
})

describe('deletionRequests', () => {
  it('a pessoa cria só o próprio pedido', async () => {
    await assertFails(
      setDoc(doc(dbAs(DONOR), 'deletionRequests', OTHER), { uid: OTHER, status: 'pendente' })
    )
    await assertSucceeds(
      setDoc(doc(dbAs(DONOR), 'deletionRequests', DONOR), { uid: DONOR, status: 'pendente' })
    )
  })

  it('leitura só admin', async () => {
    await seed((db) => setDoc(doc(db, 'deletionRequests', DONOR), { uid: DONOR, status: 'pendente' }))
    await assertFails(getDoc(doc(dbAs(DONOR), 'deletionRequests', DONOR)))
    await assertSucceeds(getDoc(doc(dbAs(ADMIN), 'deletionRequests', DONOR)))
  })
})

describe('notifications', () => {
  it('só o destinatário lê e apaga a própria notificação', async () => {
    await seed((db) =>
      setDoc(doc(db, 'notifications', 'n1'), {
        type: 'interest_accepted', userId: ADOPTER, petId: 'p1', petName: 'Rex', createdAt: serverTimestamp(),
      })
    )
    await assertFails(getDoc(doc(dbAs(OTHER), 'notifications', 'n1')))
    await assertSucceeds(getDoc(doc(dbAs(ADOPTER), 'notifications', 'n1')))
    await assertFails(deleteDoc(doc(dbAs(OTHER), 'notifications', 'n1')))
    await assertSucceeds(deleteDoc(doc(dbAs(ADOPTER), 'notifications', 'n1')))
  })

  it('interest_request: só o próprio interessado avisa o doador do pet', async () => {
    await seed((db) => setDoc(doc(db, 'pets', 'p1'), validPet()))
    await assertFails(
      setDoc(doc(dbAs(OTHER), 'notifications', 'n2'), {
        type: 'interest_request', userId: DONOR, fromUserId: ADOPTER, petId: 'p1', petName: 'Rex', createdAt: serverTimestamp(),
      })
    )
    await assertSucceeds(
      setDoc(doc(dbAs(ADOPTER), 'notifications', 'n2'), {
        type: 'interest_request', userId: DONOR, fromUserId: ADOPTER, petId: 'p1', petName: 'Rex', createdAt: serverTimestamp(),
      })
    )
  })
})
