import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-lg font-bold text-slate-800 mb-3">{title}</h2>
    <div className="text-sm text-slate-600 leading-relaxed space-y-3">{children}</div>
  </div>
);

const PrivacyPolicy = () => (
  <div className="min-h-screen bg-slate-50">
    {/* Header */}
    <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft size={16} /> Voltar ao início
        </Link>
        <div className="flex items-center gap-2 ml-auto">
          <div className="w-7 h-7 bg-amber-400 rounded-lg flex items-center justify-center text-base">🌴</div>
          <span className="font-bold text-slate-800 text-sm">Nha <span className="text-amber-500">Féria</span></span>
        </div>
      </div>
    </div>

    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Política de Privacidade</h1>
        <p className="text-sm text-slate-400">Última atualização: 29 de março de 2026</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">

        <Section title="1. Quem somos">
          <p>
            A Nha Féria é um serviço de gestão de férias e licenças para empresas, desenvolvido pela
            Servyx Labs. Estamos comprometidos com a proteção dos dados pessoais dos nossos utilizadores,
            em conformidade com a legislação aplicável de Cabo Verde e com os princípios do Regulamento
            Geral sobre a Proteção de Dados (RGPD) da União Europeia.
          </p>
          <p>
            Contacto: <a href="mailto:privacidade@nhaferia.cv" className="text-blue-600 hover:underline">privacidade@nhaferia.cv</a>
          </p>
        </Section>

        <Section title="2. Dados que recolhemos">
          <p>Recolhemos apenas os dados necessários para prestar o serviço:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Dados de conta:</strong> nome completo, endereço de e-mail, password (armazenada em formato encriptado)</li>
            <li><strong>Dados da empresa:</strong> nome da empresa, departamentos, número de colaboradores</li>
            <li><strong>Dados de perfil:</strong> cargo, departamento, ilha de residência, antiguidade</li>
            <li><strong>Dados de ausências:</strong> pedidos de férias, licenças, faltas e respetivos estados (pendente, aprovado, rejeitado)</li>
            <li><strong>Dados de uso:</strong> logs de acesso, endereço IP, tipo de dispositivo (para segurança e melhoria do serviço)</li>
          </ul>
        </Section>

        <Section title="3. Como usamos os dados">
          <p>Os seus dados são usados exclusivamente para:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Prestar o serviço de gestão de férias e ausências</li>
            <li>Enviar notificações transacionais (aprovações, convites, alertas)</li>
            <li>Garantir a segurança e prevenir acessos não autorizados</li>
            <li>Cumprir obrigações legais (ex: relatórios DGT)</li>
            <li>Melhorar a plataforma com base em padrões de uso agregados e anónimos</li>
          </ul>
          <p>Nunca vendemos, partilhamos ou cedemos os seus dados a terceiros para fins comerciais.</p>
        </Section>

        <Section title="4. Base legal do tratamento">
          <p>O tratamento dos dados baseia-se em:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Execução de contrato</strong> — necessário para prestar o serviço contratado</li>
            <li><strong>Obrigação legal</strong> — cumprimento de requisitos laborais de Cabo Verde (Código Laboral, Lei n.º 101/IV/93)</li>
            <li><strong>Interesse legítimo</strong> — segurança da plataforma e prevenção de fraude</li>
            <li><strong>Consentimento</strong> — para comunicações de marketing (se aplicável)</li>
          </ul>
        </Section>

        <Section title="5. Onde armazenamos os dados">
          <p>
            Os dados são armazenados na plataforma Supabase (infraestrutura AWS, região Europa — Frankfurt),
            que cumpre os padrões SOC 2 Type II e ISO 27001. O envio de e-mails é gerido pela Resend
            (infraestrutura nos EUA, com cláusulas contratuais adequadas).
          </p>
          <p>
            Não transferimos dados para países sem nível de proteção adequado sem as garantias exigidas por lei.
          </p>
        </Section>

        <Section title="6. Por quanto tempo guardamos os dados">
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Dados de conta ativa:</strong> enquanto a conta estiver ativa</li>
            <li><strong>Registos de ausências:</strong> 5 anos após o encerramento da conta (obrigação legal laboral)</li>
            <li><strong>Logs de segurança:</strong> 90 dias</li>
            <li>Após estes períodos, os dados são eliminados ou anonimizados de forma permanente</li>
          </ul>
        </Section>

        <Section title="7. Os seus direitos">
          <p>Tem o direito de:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Aceder</strong> aos seus dados pessoais</li>
            <li><strong>Corrigir</strong> dados incorretos ou incompletos</li>
            <li><strong>Eliminar</strong> a sua conta e dados associados</li>
            <li><strong>Portabilidade</strong> — receber os seus dados em formato legível por máquina</li>
            <li><strong>Oposição</strong> ao tratamento baseado em interesse legítimo</li>
            <li><strong>Limitar</strong> o tratamento em determinadas circunstâncias</li>
          </ul>
          <p>
            Para exercer qualquer destes direitos, contacte-nos em{' '}
            <a href="mailto:privacidade@nhaferia.cv" className="text-blue-600 hover:underline">privacidade@nhaferia.cv</a>.
            Responderemos no prazo de 30 dias.
          </p>
        </Section>

        <Section title="8. Cookies">
          <p>
            Usamos apenas cookies estritamente necessários para o funcionamento da sessão de utilizador
            (autenticação). Não utilizamos cookies de rastreamento, publicidade ou análise de terceiros.
          </p>
        </Section>

        <Section title="9. Segurança">
          <p>
            Aplicamos medidas técnicas e organizacionais para proteger os seus dados, incluindo:
            encriptação em trânsito (TLS 1.3) e em repouso, controlo de acesso baseado em funções (RBAC),
            autenticação segura via Supabase Auth, e auditorias regulares de segurança.
          </p>
        </Section>

        <Section title="10. Alterações a esta política">
          <p>
            Podemos atualizar esta política periodicamente. Em caso de alterações materiais, notificaremos
            os utilizadores por e-mail com pelo menos 30 dias de antecedência. A versão em vigor é sempre
            a publicada nesta página.
          </p>
        </Section>

        <Section title="11. Contacto">
          <p>
            Para qualquer questão sobre privacidade ou proteção de dados, contacte-nos em{' '}
            <a href="mailto:privacidade@nhaferia.cv" className="text-blue-600 hover:underline">privacidade@nhaferia.cv</a>{' '}
            ou escreva para: Servyx Labs, Praia, Santiago, Cabo Verde.
          </p>
        </Section>
      </div>
    </div>

    <footer className="text-center py-8 text-xs text-slate-400">
      © {new Date().getFullYear()} Nha Féria by Servyx Labs ·{' '}
      <Link to="/terms" className="hover:text-slate-600 transition-colors">Termos de Uso</Link>
    </footer>
  </div>
);

export default PrivacyPolicy;
