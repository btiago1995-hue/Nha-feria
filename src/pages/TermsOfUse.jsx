import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-lg font-bold text-slate-800 mb-3">{title}</h2>
    <div className="text-sm text-slate-600 leading-relaxed space-y-3">{children}</div>
  </div>
);

const TermsOfUse = () => (
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
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Termos de Uso</h1>
        <p className="text-sm text-slate-400">Última atualização: 29 de março de 2026</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">

        <Section title="1. Aceitação dos termos">
          <p>
            Ao criar uma conta ou utilizar a plataforma Nha Féria, concorda com estes Termos de Uso.
            Se não concordar, não utilize o serviço. Estes termos constituem um contrato vinculativo
            entre si (ou a empresa que representa) e a Servyx Labs.
          </p>
        </Section>

        <Section title="2. Descrição do serviço">
          <p>
            A Nha Féria é uma plataforma SaaS de gestão de férias, licenças e ausências para empresas
            em Cabo Verde. O serviço inclui:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Gestão de pedidos de férias e ausências</li>
            <li>Aprovação e rejeição de pedidos por gestores</li>
            <li>Calendário de equipa e mapa de férias</li>
            <li>Relatórios de conformidade DGT</li>
            <li>Notificações por e-mail</li>
            <li>Convite e gestão de colaboradores</li>
          </ul>
        </Section>

        <Section title="3. Contas e responsabilidades">
          <p>
            <strong>Administradores:</strong> A pessoa que cria a conta da empresa é o administrador
            e é responsável por: gerir os utilizadores da sua organização, garantir que os dados
            introduzidos são corretos, e assegurar o cumprimento das leis laborais aplicáveis.
          </p>
          <p>
            <strong>Colaboradores:</strong> Os utilizadores convidados acedem ao serviço através
            de convite do administrador e são responsáveis pela veracidade das informações que submetem.
          </p>
          <p>
            É proibido partilhar credenciais de acesso ou usar a plataforma de forma fraudulenta.
          </p>
        </Section>

        <Section title="4. Planos e pagamentos">
          <p>
            A Nha Féria oferece um plano gratuito com funcionalidades base e planos pagos com
            funcionalidades avançadas. Os preços estão disponíveis em nhaferia.cv/#precos.
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Os pagamentos são processados de forma segura e não armazenamos dados de cartão</li>
            <li>As subscrições renovam automaticamente salvo cancelamento antes da data de renovação</li>
            <li>Reembolsos podem ser solicitados em até 14 dias após o pagamento</li>
            <li>Reservamos o direito de alterar preços com aviso prévio de 30 dias</li>
          </ul>
        </Section>

        <Section title="5. Propriedade dos dados">
          <p>
            Os dados que introduz na plataforma (informações de colaboradores, pedidos de férias, etc.)
            são <strong>seus</strong>. A Servyx Labs não reivindica qualquer propriedade sobre esses dados.
          </p>
          <p>
            Pode exportar os seus dados a qualquer momento em formato CSV. Em caso de cancelamento
            da conta, os dados ficam disponíveis para exportação durante 30 dias antes de serem eliminados.
          </p>
        </Section>

        <Section title="6. Propriedade intelectual">
          <p>
            A plataforma Nha Féria, incluindo o software, design, logótipos e conteúdos, é propriedade
            exclusiva da Servyx Labs e está protegida por direitos de autor. É proibido copiar, modificar,
            distribuir ou criar trabalhos derivados sem autorização expressa.
          </p>
        </Section>

        <Section title="7. Disponibilidade e SLA">
          <p>
            Comprometemo-nos a manter a plataforma disponível com um objetivo de uptime de 99,5% mensais.
            Manutenções programadas serão comunicadas com antecedência mínima de 24 horas.
          </p>
          <p>
            Não nos responsabilizamos por indisponibilidades causadas por fatores fora do nosso controlo
            (força maior, falhas de terceiros, ataques informáticos).
          </p>
        </Section>

        <Section title="8. Limitação de responsabilidade">
          <p>
            A Nha Féria é uma ferramenta de apoio à gestão. A responsabilidade pelo cumprimento das
            obrigações laborais perante os colaboradores e autoridades é sempre da empresa utilizadora.
          </p>
          <p>
            A nossa responsabilidade total perante si não excederá o valor pago pelo serviço nos
            últimos 12 meses.
          </p>
        </Section>

        <Section title="9. Rescisão">
          <p>
            Pode cancelar a sua conta a qualquer momento em Definições. Reservamos o direito de suspender
            ou encerrar contas que violem estes termos, com ou sem aviso prévio conforme a gravidade da situação.
          </p>
        </Section>

        <Section title="10. Lei aplicável">
          <p>
            Estes termos são regidos pela lei de Cabo Verde. Quaisquer litígios serão submetidos
            à jurisdição exclusiva dos tribunais de Praia, Santiago, Cabo Verde.
          </p>
        </Section>

        <Section title="11. Contacto">
          <p>
            Para questões sobre estes termos, contacte-nos em{' '}
            <a href="mailto:legal@nhaferia.cv" className="text-blue-600 hover:underline">legal@nhaferia.cv</a>{' '}
            ou escreva para: Servyx Labs, Praia, Santiago, Cabo Verde.
          </p>
        </Section>

      </div>
    </div>

    <footer className="text-center py-8 text-xs text-slate-400">
      © {new Date().getFullYear()} Nha Féria by Servyx Labs ·{' '}
      <Link to="/privacy" className="hover:text-slate-600 transition-colors">Política de Privacidade</Link>
    </footer>
  </div>
);

export default TermsOfUse;
