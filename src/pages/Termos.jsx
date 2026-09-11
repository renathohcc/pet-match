import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import Container from '../components/Container'

const CONTACT_EMAIL = 'petmatchthe@gmail.com'
const UPDATED = '10 de setembro de 2026'

function H2({ children }) {
  return <h2 className="mb-2 mt-8 font-display text-[20px] text-blue-deep">{children}</h2>
}

function Termos() {
  return (
    <Container>
      <Helmet>
        <title>Termos de Uso — Adota.THE</title>
      </Helmet>

      <div className="mx-auto max-w-[680px] py-12 text-[15px] leading-relaxed text-ink">
        <h1 className="font-display text-[32px] text-blue-deep">Termos de Uso</h1>
        <p className="mt-2 text-[13px] text-ink-soft">Última atualização: {UPDATED}</p>

        <p className="mt-6">
          Ao usar o Adota.THE você concorda com estes termos. A plataforma é gratuita, sem fins lucrativos, e
          existe só para facilitar a <strong>adoção responsável</strong> de cães e gatos.
        </p>

        <H2>1. O que a plataforma é (e o que não é)</H2>
        <p>
          O Adota.THE apenas <strong>conecta</strong> pessoas interessadas em adotar a quem cuida do animal. A
          plataforma <strong>não intermedia, não fiscaliza e não se responsabiliza</strong> pela adoção em si:
          a combinação de visita, entrega, documentação e qualquer acordo é feita diretamente entre as partes,
          por conta e risco delas. O contato é liberado via WhatsApp após o responsável pelo pet aceitar o
          interesse.
        </p>

        <H2>2. Proibido</H2>
        <ul className="ml-5 list-disc space-y-1.5">
          <li>Vender, trocar por dinheiro, alugar ou cobrar qualquer valor pelo animal, ou pedir sinal/taxa antes do encontro.</li>
          <li>Anunciar animais para fins de cruza, revenda, testes ou maus-tratos.</li>
          <li>Publicar anúncio falso, informação enganosa sobre a saúde do animal, ou conteúdo ofensivo/ilegal.</li>
          <li>Se passar por outra pessoa ou organização.</li>
          <li>Usar robôs, raspagem em massa ou qualquer automação para acessar a plataforma.</li>
        </ul>

        <H2>3. Suas responsabilidades</H2>
        <ul className="ml-5 list-disc space-y-1.5">
          <li>Ter 18 anos ou mais.</li>
          <li>Fornecer informações verdadeiras sobre você e sobre o animal.</li>
          <li>Manter seu número de WhatsApp atualizado e correto.</li>
          <li>Avaliar com responsabilidade se tem condições de adotar antes de manifestar interesse.</li>
        </ul>

        <H2>4. Conteúdo que você publica</H2>
        <p>
          Você continua dono do que publica (fotos, textos, avaliações), mas concede ao Adota.THE o direito de
          exibir esse conteúdo na plataforma enquanto ele estiver ativo. Avaliações refletem a opinião de quem
          as escreveu. Quem recebe uma avaliação pode contestá-la; a moderação analisa caso a caso.
        </p>

        <H2>5. Moderação</H2>
        <p>
          Anúncios que acumulam denúncias podem ser ocultados da busca automaticamente e revisados pela
          moderação. Podemos remover conteúdo ou suspender contas que violem estes termos, sem aviso prévio
          quando necessário para proteger pessoas ou animais.
        </p>

        <H2>6. Sem garantias</H2>
        <p>
          A plataforma é oferecida "como está", sem garantia de disponibilidade contínua ou de que todo anúncio
          seja legítimo. Não há verificação de documentos nem visitas presenciais. Combine tudo com cautela,
          preferencialmente em local seguro e à luz do dia.
        </p>

        <H2>7. Limitação de responsabilidade</H2>
        <p>
          Na máxima medida permitida em lei, o Adota.THE e seu responsável não respondem por danos decorrentes
          do contato entre usuários, da adoção, do estado de saúde do animal, de informações incorretas
          fornecidas por terceiros ou de indisponibilidade do serviço.
        </p>

        <H2>8. Privacidade</H2>
        <p>
          O tratamento dos seus dados está descrito na{' '}
          <Link className="text-blue-mid hover:underline" to="/privacidade">Política de Privacidade</Link>.
        </p>

        <H2>9. Alterações e encerramento</H2>
        <p>
          Estes termos podem ser atualizados; mudanças relevantes serão sinalizadas na plataforma. Você pode
          encerrar sua conta a qualquer momento em Meu perfil.
        </p>

        <H2>10. Lei aplicável</H2>
        <p>
          Aplica-se a legislação brasileira. Dúvidas:{' '}
          <a className="text-blue-mid hover:underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </div>
    </Container>
  )
}

export default Termos
