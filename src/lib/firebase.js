import { initializeApp } from 'firebase/app'
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Fotos de pets vão pro Cloudinary (upload unsigned), não pro Firebase Storage —
// ver src/lib/cloudinary.js. Motivo: Storage passou a exigir plano Blaze (billing).
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const app = initializeApp(firebaseConfig)

// App Check (reCAPTCHA v3) — atesta que os requests vêm do nosso app no
// navegador, cortando o grosso do abuso programático de Firestore/Cloudinary.
// Só liga quando a site key está configurada (permite rodar local/CI sem ela).
// Em dev, defina VITE_APPCHECK_DEBUG_TOKEN com o token gerado no console.
const appCheckSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY
if (appCheckSiteKey) {
  try {
    const debugToken = import.meta.env.VITE_APPCHECK_DEBUG_TOKEN
    if (debugToken && typeof window !== 'undefined') {
      window.FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken
    }
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(appCheckSiteKey),
      isTokenAutoRefreshEnabled: true,
    })
  } catch (err) {
    // Um problema no App Check (chave errada, reCAPTCHA fora do ar) nunca
    // pode impedir o app de subir — pior caso, os requests vão sem token.
    console.error('App Check não inicializou:', err)
  }
}

export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)
