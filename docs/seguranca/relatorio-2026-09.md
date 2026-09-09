# Curadoria técnica de segurança — Adota.THE

**Data:** 2026-09-09
**Escopo:** segurança da plataforma, proteção dos dados dos usuários e sistemas anti-fraude.
**Base de código analisada:** frontend React + Vite, `firestore.rules`, `.github/workflows/deploy.yml`, `scripts/`, integração Cloudinary.

> Este é um documento de diagnóstico. Nenhuma alteração de segurança foi feita ainda — o roadmap ao final serve para planejar e aprovar cada fase separadamente.

---

## 1. Contexto de arquitetura (o que molda o modelo de ameaça)

- Frontend **estático** (React + Vite) hospedado no GitHub Pages, a partir de **repositório público**. **Não há backend, não há Cloud Functions, não há Firebase App Check.**
- Toda a autorização real vive nas **Firestore Security Rules** (`firestore.rules`, 263 linhas). É o **único perímetro de segurança** — os guards de rota React (`RequireAuth`, `RequireAdmin`) só escondem UI.
- **Autenticação:** somente Google (`signInWithPopup`). Contas já vêm com e-mail verificado pelo Google. Não há e-mail/senha, verificação de e-mail própria nem recuperação de senha (não se aplica).
- **Admin:** um único UID fixo no código (`vJwhGPjI6eYVyl7XAfMevNKfJHR2`), duplicado em `firestore.rules:18` e `src/lib/admin.js`. Sem papéis, sem custom claims, sem procedimento de emergência.
- **Dados pessoais no Firestore hoje são mínimos:** `users/{uid}` guarda só `displayName`, `photoURL`, `tutorType`, `onboarded`. **O e-mail nunca é gravado no Firestore** (existe só no registro do Firebase Auth). Telefone/WhatsApp fica em `petContacts/{petId}`, separado do documento público do pet.
- **Fotos** vão do navegador direto para o **Cloudinary** via *upload preset* não assinado (`petmatch_pets`, cloud `gmhrbocv`) — sem chave secreta no cliente, por design.
- `npm audit --omit=dev` → **0 vulnerabilidades**. Nenhum uso de `dangerouslySetInnerHTML` / `innerHTML` / `eval` — o React escapa todo texto de usuário.

---

## 2. O que já está bem feito (não regredir)

| # | Controle |
|---|---|
| ✅ | **Liberação de contato imposta nas regras**, não só na UI (`firestore.rules:143-146`): o WhatsApp do doador só é legível pelo próprio doador ou por quem tem `interests/{petId_uid}.status` em `aceito` / `confirmacao_pendente` / `confirmado`. |
| ✅ | **Criação de avaliação amarrada ao par real** doador/adotante, validada por leitura do documento do pet (`firestore.rules:162-175`) — proteção sólida contra avaliação falsa. |
| ✅ | Só o **adotante confirmado** pode marcar o pet como `adotado` (`firestore.rules:62-67`). |
| ✅ | `interests` create exige `donorId == petDonorId(petId)` — impede forjar interesse contra um doador arbitrário. |
| ✅ | `notifications` create é escopado por tipo — difícil spammar notificações para usuários arbitrários. |
| ✅ | Segredos (`.env.local`, `scripts/serviceAccountKey.json`) estão no `.gitignore` e **nunca entraram no histórico do git** (verificado). |
| ✅ | Deploy no GitHub Actions com permissões mínimas (`contents: read`, `pages: write`, `id-token: write`). |
| ✅ | Sem Analytics / `measurementId` — menos rastreamento de usuário. |

---

## 3. Achados

Severidade: **Crítico** (agir já) · **Alto** (curto prazo) · **Médio** (planejado) · **Baixo** (observação).

### 🔴 Críticos

#### C1 — Regras do Firestore não são publicadas pelo CI (risco de divergência)
`deploy.yml` só builda e publica o frontend. Nada roda `firebase deploy --only firestore:rules`. O `firestore.rules` do repositório **pode não refletir** o que está ativo no projeto `petmatch-4cf3c`. Sem publicação automatizada, uma edição manual no console (ou o esquecimento de publicar após um merge) deixa o perímetro real divergente e sem revisão de código.
**Impacto:** o único perímetro de segurança fica sem garantia de integridade.

#### C2 — Chave de service account (admin total) na área de trabalho sincronizada
`scripts/serviceAccountKey.json` é uma chave privada real de **admin do Firebase** — ela **ignora todas as Security Rules**. Não está no git (correto), mas fica em `C:\Users\...\OneDrive\Desktop\` — ou seja, **sincronizada para a nuvem do OneDrive**. Qualquer acesso à conta OneDrive ou à máquina = controle total do projeto: ler, alterar e apagar todos os dados de todos os usuários.
**Impacto:** comprometimento total do banco de dados.

#### C3 — Coleção `users` com leitura pública total e escrita sem validação
`firestore.rules:81-82`:
- `allow read: if true` — qualquer um (sem login) lê a **coleção inteira** de usuários (`listAllUsers()` funciona anônimo).
- `allow write: if isSignedIn() && request.auth.uid == userId` — **zero validação de schema**. O dono do próprio documento pode gravar qualquer campo, de qualquer tamanho.

Hoje o dano é limitado (só nome/foto/tipo), mas:
- (a) **qualquer campo pessoal novo** adicionado a `users` no futuro fica instantaneamente público;
- (b) `write` inclui `delete` — o usuário apaga o próprio documento e quebra referências;
- (c) sem limite de tamanho → hospedagem de blob arbitrário legível publicamente;
- (d) `displayName` livre permite se passar por **"Adota.THE Oficial"** ou pelo nome de uma ONG conhecida.

**Impacto:** vazamento futuro de dados pessoais, impersonação, abuso de armazenamento.

### 🟠 Altos

#### A1 — Upload preset do Cloudinary sem limites verificáveis
`src/lib/cloudinary.js`: nenhuma validação de tipo/tamanho/dimensão no cliente (só o hint `accept="image/*"`); a pasta (`folder`) é parâmetro controlado pelo cliente; sem moderação; sem limite de taxa. Qualquer pessoa pode enviar imagens arbitrárias para a conta `gmhrbocv` de qualquer lugar (consumo de banda/armazenamento, hospedagem de conteúdo ilícito sob o seu domínio Cloudinary). O `MAX_PHOTOS = 5` é só um `.slice()` no cliente.
**Mitigação parcial:** as travas configuradas no *preset* pelo painel do Cloudinary (não visíveis no repositório — **precisam ser auditadas**).

#### A2 — Sem limite de taxa (rate limiting) nem App Check em nada
Nenhum limite na criação de `pets`, `interests`, `reports`, `reviews`, `notifications` ou uploads. Sem Firebase App Check. Um script com **um único login Google** consegue criar documentos em massa dentro do que as regras permitem: inundar a busca com anúncios falsos, spammar denúncias, encher as notificações de doadores.
**Impacto:** abuso / DoS de conteúdo, degradação da plataforma, custo no Firestore.

#### A3 — Criação de `pets`: campos livres não validados e `createdAt` não fixado
`hasValidPetShape` (`firestore.rules:34-43`) valida apenas a presença de `name/species/size/sex/city/status/donorId/createdAt`. **Não valida:**
- `story`, `breed`, `health`, `temperament` — texto livre, qualquer tamanho;
- `image` / `thumbs` — qualquer string; **não precisa ser** uma URL `res.cloudinary.com/gmhrbocv/...` (permite apontar imagem para domínio externo — rastreamento, spoofing);
- `createdAt` não é forçado a `request.time` — pode ser pré/pós-datado para manipular ordenação de listas;
- `adopterId` não é barrado na criação.

#### A4 — Enumeração completa de dados públicos + métricas de negócio
`pets`, `users`, `reviews` e `reviewDisputes` são todos `read: if true`. Um cliente anônimo consegue extrair:
- todo pet (incluindo adotados, com `adopterId`);
- todo perfil de usuário;
- toda avaliação + **respostas da pesquisa pós-adoção** (ex.: `jaTinhaPet`, `experiencia`) atreladas publicamente a um perfil nomeado;
- **o motivo de cada disputa** — `reviewDisputes` expõe `reason` + cópia do comentário + os IDs dos dois usuários;
- `getSiteStats()` (`src/lib/adminStats.js`) → contadores agregados (total de usuários, de adoções) para qualquer um.

**Impacto:** privacidade (pesquisas e disputas expostas), scraping, exposição de métricas internas.

#### A5 — Resolver denúncia = exclusão permanente, sem trilha de auditoria
`src/lib/reports.js` apaga o documento de `reports` ao resolver. `reports` também não valida `reason` / `details` / `petId` nem tem limite de taxa na criação (`firestore.rules:206-208`). Sem histórico de moderação: impossível provar um padrão de abuso de um doador reincidente ou revisar decisões.

#### A6 — Admin único, sem redundância
Perder a conta Google `vJwhGPjI6eYVyl7XAfMevNKfJHR2` (perda de acesso, suspensão da conta) significa perder **toda a moderação** e a capacidade de editar as regras pelo fluxo normal. Sem segundo admin e sem procedimento de emergência documentado.

### 🟡 Médios

| # | Achado |
|---|---|
| **M1** | **EXIF/GPS não removido das fotos de pet.** Avatares passam por `<canvas>` (`src/lib/imageCrop.js`), que descarta EXIF; **as fotos de pet em `Cadastrar.jsx` sobem cruas**. Se o preset do Cloudinary não remover metadados, a localização GPS da casa do doador pode vazar na URL pública. |
| **M2** | **Sem validação de formato do WhatsApp.** `Cadastrar.jsx` aceita texto livre; as regras de `petContacts` não checam que `whatsapp` é uma string com cara de telefone. Um erro de digitação manda o adotante para o número errado (possivelmente de um terceiro real). |
| **M3** | **Sem detecção de duplicata / repost.** O mesmo doador pode publicar o mesmo pet infinitas vezes. `generateUniquePetSlug` só evita colisão de ID. |
| **M4** | **`index.html` sem cabeçalhos de segurança / preview.** Sem CSP (nem via `<meta http-equiv>`), sem `referrer-policy`. Sem tags `og:*` — e onde há preview (`PetDetail.jsx`), `og:description` / `og:image` vêm de `pet.story` / `pet.image` controlados pelo doador → spoofing de link preview. |
| **M5** | **Deploy sem porta de qualidade.** `deploy.yml` não roda `npm run lint` nem testes antes de publicar. Não há testes no projeto. Uma regressão vai direto para produção. |
| **M6** | **`react-helmet-async ^3.0.0`.** A versão amplamente usada é a 2.x — a 3.0.0 fixada precisa ser verificada (resolve? manutenção ativa?). Sem Dependabot, sem `npm audit` no CI, sem `.nvmrc`. |
| **M7** | **`listAllUsers()` / `listAllReviews()` / `listMyPets(uid)` sem restrição de quem chama.** Funcionam para qualquer `uid` / sem login, apesar de "parecerem" de admin. Hoje sem dado sensível, mas frágil a mudanças futuras. |

### 🟢 Baixos / observações

- **B1** — `redirectTo` em `Entrar.jsx` é `navigate()` interno; sem open-redirect externo. OK.
- **B2** — Links de WhatsApp abrem com `noopener`. OK.
- **B3** — Pets do seed têm `donorId: 'seed-donor'` (inexistente) → só o admin edita/apaga. Cosmético.
- **B4** — Sem página de **Política de Privacidade / Termos de Uso**, apesar de coletar dados de usuário e respostas de pesquisa. Provável exigência da LGPD.

---

## 4. Roadmap de remediação (por fases)

> Cada fase será detalhada e aprovada separadamente. Ordem por risco × esforço.

### Fase S1 — Contenção imediata (baixo esforço, alto impacto)
- **C2** — Mover `serviceAccountKey.json` para fora do OneDrive (ex.: `%USERPROFILE%\.secrets\`), apontar `scripts/seed.js` via `GOOGLE_APPLICATION_CREDENTIALS`, e **rotacionar a chave** no console (revogar a antiga). Documentar em `CLAUDE.md`.
- **C1** — Adicionar publicação de regras ao CI (`firebase deploy --only firestore:rules` com service account de CI restrito, em secret do Actions), disparada por mudança em `firestore.rules`. Alternativa mínima: checklist manual + verificação de diff documentada.
- **C3 (parte)** — Endurecer as regras de `users`: manter leitura pública, mas validar escrita (só chaves conhecidas, tipos corretos, `displayName` 1–40 caracteres, tamanho total limitado); `allow delete: if false`. Novo helper `hasValidUserShape()`.
- **A6** — Criar segundo admin (lista de UIDs em `firestore.rules` + `src/lib/admin.js`, ou custom claims) e documentar o procedimento de emergência.

### Fase S2 — Endurecer regras e validação de conteúdo
- **A3** — Expandir `hasValidPetShape`: limitar tamanho de `story` / `breed` / `health` / `temperament`; validar que `image` / `thumbs` casam com `^https://res\.cloudinary\.com/gmhrbocv/`; forçar `createdAt == request.time`; barrar `adopterId` na criação.
- **A4** — Restringir leitura de `reviewDisputes` (só admin + os dois envolvidos); adicionar um booleano `underDispute` no próprio review (escrito por regra) para o `ReviewsList` esconder o comentário sem precisar ler o motivo. Avaliar tornar as respostas da pesquisa pós-adoção privadas (só agregado no admin), mantendo público apenas `rating` + `comment`.
- **M2** — Validar formato de telefone no cliente (`Cadastrar.jsx`) e nas regras de `petContacts`.
- **A5** — Parar de excluir `reports`; adicionar `status` (`aberta` / `resolvida` / `descartada`) + `resolvedBy` + `resolvedAt` + nota; validar shape e limitar tamanho na criação.

### Fase S3 — Anti-abuso e anti-fraude
- **A1 / A2 / M1** — Habilitar **Firebase App Check** (reCAPTCHA v3 no web) — corta a maior parte do abuso programático do Firestore. Auditar e endurecer o preset do Cloudinary no painel: tipos permitidos, tamanho máximo, remoção de metadados (resolve **M1**), moderação (`aws_rek` ou fila manual), pasta fixa no preset (ignorar o `folder` do cliente).
- **A2** — Rate limiting leve via documento `rateLimits/{uid}` checado nas regras (contador + janela de tempo) para criação de `pets` / `reports` / `interests`; ou mover a criação de pet/denúncia para uma Cloud Function (exige plano Blaze — decisão do usuário).
- **M3** — Detecção simples de duplicata: bloquear novo pet do mesmo `donorId` com mesmo `name` + `city` nas últimas 24h.
- **Fila de moderação** — novos pets entram como `status: 'pendente_revisao'` e só aparecem na busca após aprovação (ou revisão pós-publicação com auto-ocultação após N denúncias).

### Fase S4 — Conformidade e endurecimento de plataforma
- **B4** — Página de Política de Privacidade + Termos de Uso (LGPD); consentimento explícito no onboarding; mecanismo de exclusão de conta/dados.
- **M4** — CSP via `<meta http-equiv="Content-Security-Policy">` no `index.html` (limitar `script-src`, `img-src` a Cloudinary + Google, `connect-src` a Firebase); `referrer-policy`. Limitar `og:description` a um resumo neutro em vez de `pet.story` cru.
- **M5 / M6** — `npm run lint` como porta no `deploy.yml`; suíte mínima de testes das regras (emulador + `@firebase/rules-unit-testing`); Dependabot; `.nvmrc`; verificar/pinar `react-helmet-async`.
- **M7** — Substituir `listAllUsers` / `listAllReviews` por consultas paginadas e restringir a leitura coletiva a admin nas regras; telas públicas usam só `getPublicProfile` / consultas escopadas.

---

## 5. Resumo executivo

| Severidade | Qtd | Itens |
|---|---|---|
| 🔴 Crítico | 3 | C1 publicação de regras no CI · C2 chave admin no OneDrive · C3 `users` aberto/sem validação |
| 🟠 Alto | 6 | A1 Cloudinary · A2 rate limiting/App Check · A3 validação de `pets` · A4 enumeração pública · A5 auditoria de denúncias · A6 admin único |
| 🟡 Médio | 7 | M1–M7 |
| 🟢 Baixo | 4 | B1–B4 |

**Recomendação:** executar a **Fase S1** imediatamente (poucas horas, elimina os três críticos), depois planejar S2–S4 uma a uma.
