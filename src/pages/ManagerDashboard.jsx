import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  Download,
  FileText,
  AlertTriangle,
  History,
  Inbox,
  Sun,
  BarChart2,
  ClipboardList,
  CheckCircle2,
} from 'lucide-react';
import SumCard from '../components/ui/SumCard';
import ApprovalList from '../components/ui/ApprovalList';
import GanttChart from '../components/ui/GanttChart';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { y: 16, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } }
};

const ManagerDashboard = () => {
  const { profile } = useOutletContext();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [teamProfiles, setTeamProfiles] = useState([]);
  const [ganttData, setGanttData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchManagerData();
  }, []);

  const fetchManagerData = async () => {
    setLoading(true);
    try {
      const { data: pendingReqs, error: reqError } = await supabase
        .from('leave_requests')
        .select('*, profiles!leave_requests_user_id_fkey(full_name, avatar_url)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (reqError) throw reqError;

      const formattedRequests = pendingReqs.map(r => ({
        id: r.id,
        workerName: r.profiles?.full_name || 'Desconhecido',
        avatar: r.profiles?.full_name?.charAt(0) || 'U',
        startDate: r.start_date,
        endDate: r.end_date,
        type: r.type,
        status: r.status,
        description: r.description
      }));
      setRequests(formattedRequests);

      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*');
      if (profileError) throw profileError;
      setTeamProfiles(profiles || []);

      const { data: approvedReqs, error: approvedError } = await supabase
        .from('leave_requests')
        .select('*, profiles!leave_requests_user_id_fkey(full_name)')
        .eq('status', 'approved');

      if (approvedError) throw approvedError;

      const grouped = approvedReqs.reduce((acc, curr) => {
        const userName = curr.profiles?.full_name || 'Usuário';
        if (!acc[userName]) acc[userName] = { name: userName, avatar: userName.charAt(0), requests: [] };
        acc[userName].requests.push({ startDate: curr.start_date, endDate: curr.end_date });
        return acc;
      }, {});
      setGanttData(Object.values(grouped));

    } catch (err) {
      console.error('Error fetching manager data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .update({ status: 'approved', approved_by: profile.id })
        .eq('id', id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) throw new Error('Sem permissão para aprovar pedidos.');
      setRequests(requests.filter(r => r.id !== id));
      fetchManagerData();
      alert('Pedido aprovado com sucesso!');
    } catch (err) {
      alert('Erro ao aprovar pedido: ' + (err.message || 'Sem permissão.'));
    }
  };

  const handleReject = async (id) => {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .update({ status: 'rejected', approved_by: profile.id })
        .eq('id', id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) throw new Error('Sem permissão para recusar pedidos.');
      setRequests(requests.filter(r => r.id !== id));
      alert('Pedido recusado.');
    } catch (err) {
      alert('Erro ao recusar pedido: ' + (err.message || 'Sem permissão.'));
    }
  };

  const stats = {
    pendingCount: requests.length,
    teamSize: teamProfiles.length,
    offToday: ganttData.filter(u => u.requests.some(r => {
      const today = new Date().toISOString().split('T')[0];
      return today >= r.startDate && today <= r.endDate;
    })).length
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-7 max-w-[1240px] mx-auto pb-20"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-text text-gradient">Visão Geral de Gestão</h2>
          <p className="text-sm text-text-muted">Disponibilidade e conformidade da equipa em tempo real.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-radius-sm text-sm font-semibold hover:bg-bg hover:border-text/10 transition-all shadow-sm active:scale-95 cursor-pointer">
          <Download size={15} />
          Exportar Relatório 2026
        </button>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SumCard
          icon={<Inbox className="w-5 h-5" />}
          value={stats.pendingCount}
          label="Pedidos Pendentes"
          trend="Aguardam aprovação"
          trendColor="warn"
        />
        <SumCard
          icon={<Sun className="w-5 h-5" />}
          value={stats.offToday}
          label="De férias hoje"
          trend="Sincronizado"
          trendColor="success"
        />
        <SumCard
          icon={<Users className="w-5 h-5" />}
          value={stats.teamSize}
          label="Equipa Ativa"
          trend="Utilizadores"
          trendColor="muted"
        />
        <SumCard
          icon={<AlertTriangle className="w-5 h-5" />}
          value="0"
          label="Alertas de Acumulação"
          trend="Zero riscos"
          trendColor="success"
        />
      </motion.div>

      {/* Approvals + Who's Off */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div variants={itemVariants} className="bg-white rounded-radius border border-border shadow-sm flex flex-col">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
              <History size={15} />
              Pedidos de Aprovação
            </div>
            <button onClick={() => navigate('/manager-calendar')} className="text-xs font-semibold text-primary-light hover:underline cursor-pointer">Ver Todos</button>
          </div>
          <div className="p-5">
            <ApprovalList requests={requests} onApprove={handleApprove} onReject={handleReject} />

            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-5 p-4 bg-amber-50 border border-amber-200 rounded-radius-sm flex gap-3 items-start"
            >
              <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={16} />
              <p className="text-xs text-amber-800 leading-relaxed">
                <strong>Pedro Tavares</strong> tem 38 dias acumulados. Risco de ultrapassar o limite legal de 44 dias em Cabo Verde.
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Who's off + Stats */}
        <div className="space-y-5">
          <div className="bg-white rounded-radius border border-border shadow-sm p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                <Calendar size={15} />
                Quem está de férias hoje
              </div>
              <span className="text-xs text-text-muted">24 Mar 2026</span>
            </div>
            <div className="space-y-2">
              {stats.offToday > 0 ? (
                ganttData.filter(u => u.requests.some(r => {
                  const today = new Date().toISOString().split('T')[0];
                  return today >= r.startDate && today <= r.endDate;
                })).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-bg rounded-radius-sm hover:bg-bg/80 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {item.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-text leading-tight">{item.name}</div>
                      <div className="text-xs text-text-muted">Em férias</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-text-muted bg-bg/30 border border-dashed border-border rounded-radius-sm">
                  Ninguém está ausente hoje.
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-radius border border-border shadow-sm p-5">
            <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
              <BarChart2 size={15} />
              Saldo Médio da Equipa
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-bg rounded-radius-sm text-center">
                <div className="text-2xl font-bold text-primary">19.4</div>
                <div className="text-xs text-text-muted mt-1">Dias médios disponíveis</div>
              </div>
              <div className="p-4 bg-bg rounded-radius-sm text-center">
                <div className="text-2xl font-bold text-emerald-600">87%</div>
                <div className="text-xs text-text-muted mt-1">Taxa de aprovação</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gantt Chart */}
      <motion.div variants={itemVariants} className="bg-white rounded-radius border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        <div className="px-6 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
            <Calendar size={15} />
            Mapa de Férias Global – 2026
          </div>
          <select className="bg-bg border border-border rounded-radius-sm px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary-light/30 cursor-pointer">
            <option>Todos os Departamentos</option>
            <option>TI</option>
            <option>Comercial</option>
            <option>Financeiro</option>
          </select>
        </div>
        <div className="p-5">
          <GanttChart data={ganttData} />

          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 pt-4 border-t border-border">
            <LegendItem color="#3B82F6" label="Vendas" />
            <LegendItem color="#F59E0B" label="TI" />
            <LegendItem color="#10B981" label="Operações" />
            <LegendItem color="#7C3AED" label="RH" />
            <LegendItem color="#EF4444" label="Contabilidade" />
          </div>
        </div>
      </motion.div>

      {/* Compliance Reports */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
          <FileText size={15} />
          Relatórios de Conformidade Laboral
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ReportCard
            icon={<BarChart2 className="w-6 h-6 text-primary-light" />}
            title="Mapa de Férias Anual"
            desc="Gera e exporta o mapa anual obrigatório (Código Laboral CV)."
            btnText="Exportar PDF"
          />
          <ReportCard
            icon={<ClipboardList className="w-6 h-6 text-primary-light" />}
            title="Relatório DGT"
            desc="Dados formatados para a Direção Geral do Trabalho."
            btnText="Exportar DGT"
          />
          <ReportCard
            icon={<AlertTriangle className="w-6 h-6 text-accent" />}
            title="Alertas de Acumulação"
            desc="Trabalhadores próximos do limite legal de 44 dias."
            btnText="Ver Alertas"
            btnColor="accent"
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

const LegendItem = ({ color, label }) => (
  <div className="flex items-center gap-1.5">
    <div className="w-5 h-2 rounded-full" style={{ backgroundColor: color }} />
    <span className="text-xs text-text-muted font-medium">{label}</span>
  </div>
);

const ReportCard = ({ icon, title, desc, btnText, btnColor = 'primary' }) => (
  <div className="bg-white border border-border rounded-radius p-5 hover:shadow-md transition-all group">
    <div className="mb-3">{icon}</div>
    <h4 className="text-sm font-bold text-text mb-1 group-hover:text-primary-light transition-colors">{title}</h4>
    <p className="text-xs text-text-muted leading-relaxed mb-5">{desc}</p>
    <button className={`w-full py-2.5 rounded-radius-sm text-xs font-bold text-white transition-all cursor-pointer
      ${btnColor === 'accent' ? 'bg-accent hover:bg-accent-hover' : 'bg-primary hover:bg-primary-light'}`}>
      {btnText}
    </button>
  </div>
);

export default ManagerDashboard;
