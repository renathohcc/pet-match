import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import Container from '../components/Container'

const PRIVACY_EMAIL = 'petmatchthe@gmail.com'
// PREENCHER antes de divulgar: nome completo do responsável (pessoa física).
const CONTROLLER = '[nome completo do responsável]'
const UPDATED = '10 de setembro de 2026'

function H2({ children }) {
  return <h2 className="mb-2 mt-8 font-display text-[20px] text-blue-deep">{children}</h2>
}

function Privacidade() {
  return (
    <Container>
      <Helmet>
        <title>Política de Privacidade — Adota.THE</title>
      </Helmet>

      <div className="mx-auto max-w-[680px] py-12 text-[15px] leading-relaxed text-ink">
        <h1 className="font-display text-[32px] text-blue-deep">Política de Privacidade</h1>
        <p className="mt-2 text-[13px] text-ink-soft">Última atualização: {UPDATED}</p>

        <p className="mt-6">
          O Adota.THE é uma plataforma gratuita e sem fins lucrativos que conecta pessoas que querem adotar
          cães e gatos a quem cuida desses animais. Esta política explica quais dados a plataforma trata, para
          quê, e quais são os seus direitos, conforme a Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018).
        </p>

        <H2>1. Quem é o responsável (controlador)</H2>
        <p>
          A plataforma é operada por {CONTROLLER}, pessoa física, sem fins lucrativos. Contato para assuntos de
          privacidade: <a className="text-blue-mid hover:underline" href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>.
        </p>

        <H2>2. Dados que tratamos</H2>
        <ul className="ml-5 list-disc space-y-1.5">
          <li>
            <strong>Da sua conta Google (ao entrar):</strong> nome, endereço de e-mail, foto de perfil e o
            identificador da conta. O e-mail fica apenas no serviço de autenticação (Firebase Authentication) e
            não é exibido publicamente nem compartilhado.
          </li>
          <li>
            <strong>Do seu perfil:</strong> nome de exibição (que você pode editar), tipo de tutor
            (independente ou ONG/protetor) e foto de perfil. Esses dados são <strong>públicos</strong> — aparecem
            na sua página de perfil e ao lado dos seus anúncios e avaliações.
          </li>
          <li>
            <strong>Ao cadastrar um pet:</strong> informações e fotos do animal, bairro e cidade, e o número de
            WhatsApp de contato. O WhatsApp fica <strong>separado do anúncio público</strong> e só é liberado para
            quem você aceitar como interessado.
          </li>
          <li>
            <strong>Ao manifestar interesse:</strong> uma mensagem opcional para o responsável pelo pet.
          </li>
          <li>
            <strong>Após uma adoção:</strong> a nota (1 a 5), o comentário (opcional) e as respostas da pesquisa
            pós-adoção. Nota e comentário são <strong>públicos</strong>, ligados ao seu perfil.
          </li>
          <li>
            <strong>Denúncias</strong> que você enviar (motivo e detalhes) — visíveis apenas para a moderação.
          </li>
          <li>
            <strong>Favoritos</strong> ficam salvos no seu perfil para você acessar de qualquer dispositivo.
          </li>
        </ul>
        <p className="mt-2">
          Não coletamos endereço completo, documentos, dados de pagamento nem localização por GPS. A plataforma
          não cobra nada e não intermedia dinheiro.
        </p>

        <H2>3. Para que usamos</H2>
        <ul className="ml-5 list-disc space-y-1.5">
          <li>Permitir o cadastro de pets, a busca e o contato entre as partes (execução do serviço).</li>
          <li>Exibir perfis e avaliações públicas, para dar segurança a quem vai decidir adotar (legítimo interesse).</li>
          <li>Prevenir fraude e abuso (limite de ações, verificação anti-bot via Google reCAPTCHA, moderação de denúncias).</li>
          <li>Melhorar a plataforma, de forma agregada, com base nas respostas da pesquisa pós-adoção.</li>
        </ul>

        <H2>4. Com quem compartilhamos</H2>
        <p>Não vendemos seus dados. Usamos prestadores de serviço que processam dados apenas para operar a plataforma:</p>
        <ul className="ml-5 list-disc space-y-1.5">
          <li><strong>Google Firebase</strong> (autenticação e banco de dados) e <strong>GitHub Pages</strong> (hospedagem do site).</li>
          <li><strong>Cloudinary</strong> — armazenamento das fotos de pets e de perfil.</li>
          <li><strong>Google reCAPTCHA Enterprise</strong> — proteção contra uso automatizado abusivo.</li>
        </ul>
        <p className="mt-2">
          Esses serviços podem processar dados fora do Brasil. O contato via WhatsApp acontece diretamente entre
          você e a outra pessoa, fora da plataforma — a partir daí, aplica-se a política do WhatsApp.
        </p>

        <H2>5. Por quanto tempo guardamos</H2>
        <p>
          Enquanto sua conta existir. Ao excluir a conta, apagamos seu perfil, seus anúncios ainda disponíveis e
          seus pedidos de interesse. Registros ligados a adoções já concluídas e as avaliações públicas podem ser
          mantidos por mais tempo para preservar a confiança da plataforma (legítimo interesse), sendo
          desvinculados da sua identidade sempre que possível.
        </p>

        <H2>6. Seus direitos</H2>
        <p>Você pode, a qualquer momento:</p>
        <ul className="ml-5 list-disc space-y-1.5">
          <li>Acessar e corrigir seus dados — na página <Link className="text-blue-mid hover:underline" to="/perfil">Meu perfil</Link>.</li>
          <li>
            Excluir sua conta — botão na página Meu perfil. A exclusão apaga o que a plataforma consegue apagar
            automaticamente e registra um pedido para a moderação concluir o restante.
          </li>
          <li>Solicitar informações sobre o tratamento ou a portabilidade dos seus dados pelo e-mail de contato.</li>
        </ul>

        <H2>7. Segurança</H2>
        <p>
          O acesso aos dados é controlado por regras de segurança no banco de dados e por verificação anti-bot.
          Ainda assim, nenhum sistema é 100% seguro — se identificar um problema, avise pelo e-mail de contato.
        </p>

        <H2>8. Crianças e adolescentes</H2>
        <p>A plataforma é destinada a maiores de 18 anos. Não coletamos intencionalmente dados de menores.</p>

        <H2>9. Mudanças nesta política</H2>
        <p>
          Podemos atualizar este texto. Mudanças relevantes serão sinalizadas na plataforma. A data no topo
          indica a última revisão.
        </p>

        <H2>10. Contato</H2>
        <p>
          Dúvidas ou solicitações sobre privacidade:{' '}
          <a className="text-blue-mid hover:underline" href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>.
        </p>

        <p className="mt-8 text-[13px] text-ink-soft">
          Veja também os <Link className="text-blue-mid hover:underline" to="/termos">Termos de Uso</Link>.
        </p>
      </div>
    </Container>
  )
}

export default Privacidade
