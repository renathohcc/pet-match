import crypto from 'node:crypto'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// CSP só no build de produção — em dev o Vite precisa de inline/eval/ws pro HMR.
// Os scripts inline do index.html (redirect SPA do GitHub Pages) entram por
// hash sha256, então não precisamos de 'unsafe-inline' pra script-src.
function contentSecurityPolicy() {
  return {
    name: 'inject-csp',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        const inlineHashes = []
        const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g
        let match
        while ((match = re.exec(html)) !== null) {
          const hash = crypto.createHash('sha256').update(match[1], 'utf8').digest('base64')
          inlineHashes.push(`'sha256-${hash}'`)
        }

        const csp = [
          "default-src 'self'",
          `script-src 'self' ${inlineHashes.join(' ')} https://www.google.com https://www.gstatic.com https://www.recaptcha.net https://apis.google.com`,
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' data: https://fonts.gstatic.com",
          "img-src 'self' data: blob: https://res.cloudinary.com https://*.googleusercontent.com https://images.unsplash.com",
          "connect-src 'self' https://*.googleapis.com wss://*.firestore.googleapis.com https://api.cloudinary.com https://www.google.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com",
          "frame-src https://www.google.com https://*.firebaseapp.com https://accounts.google.com",
          "worker-src 'self' blob:",
          "base-uri 'self'",
          "object-src 'none'",
          "form-action 'self'",
        ].join('; ')

        return html.replace(
          '</head>',
          `  <meta http-equiv="Content-Security-Policy" content="${csp}" />\n` +
            `    <meta name="referrer" content="strict-origin-when-cross-origin" />\n  </head>`
        )
      },
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: '/pet-match/',
  plugins: [react(), contentSecurityPolicy()],
})
