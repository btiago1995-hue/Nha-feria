import React, { useState } from 'react';
import { X, CheckCircle2, MessageSquare, Mail, Copy, Check } from 'lucide-react';
import { useCompany } from '../../lib/CompanyContext';
import { supabase } from '../../lib/supabase';
import { sendEmail } from '../../utils/sendEmail';

const InviteModal = ({ isOpen, onClose, onAdd }) => {
  const { departments } = useCompany() || {};
  const deptList = departments || ['Tecnologia'];

  const [step, setStep]         = useState('form'); // 'form' | 'loading' | 'success'
  const [inviteUrl, setInviteUrl] = useState('');
  const [copied, setCopied]     = useState(false);
  const [error, setError]       = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    department: '',
    balance: 22,
    tenureMonths: 0,
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setStep('loading');

    try {
      // Get the current authenticated user's profile for company_id + invited_by
      const { data: { user } } = await supabase.auth.getUser();
      const { data: inviterProfile } = await supabase
        .from('profiles')
        .select('id, company_id, full_name')
        .eq('id', user.id)
        .single();

      // Insert the invite record and get back the generated token
      const { data: invite, error: insertErr } = await supabase
        .from('company_invites')
        .insert({
          company_id:       inviterProfile?.company_id,
          invited_by:       user.id,
          full_name:        formData.name,
          role_label:       formData.role,
          department:       formData.department || null,
          vacation_balance: formData.balance,
          tenure_months:    formData.tenureMonths,
        })
        .select('token')
        .single();

      if (insertErr) throw insertErr;

      // Build the invite URL using the current origin
      const origin = window.location.origin;
      const url = `${origin}/invite/${invite.token}`;
      setInviteUrl(url);

      // Auto-send invite email if address was provided
      if (formData.email) {
        const { data: company } = await supabase
          .from('companies')
          .select('name')
          .eq('id', inviterProfile?.company_id)
          .single();
        sendEmail({
          type: 'invite',
          toEmail: formData.email,
          toName: formData.name,
          inviterName: inviterProfile?.full_name || 'O teu gestor',
          companyName: company?.name || 'a empresa',
          inviteUrl: url,
        });
      }

      // Notify parent (adds to local list optimistically)
      onAdd(formData);
      setStep('success');
    } catch (err) {
      console.error('Invite creation failed:', err);
      setError('Erro ao criar convite. Tenta novamente.');
      setStep('form');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select the text
    }
  };

  const handleShare = (method) => {
    const message = `Olá ${formData.name}! 👋 O teu gestor convidou-te para a Nha Féria. Acede aqui para criar a tua conta: ${inviteUrl}`;
    const subject = 'Convite Nha Féria';
    if (method === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    } else if (method === 'gmail') {
      window.open(`https://mail.google.com/mail/?view=cm&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`, '_blank');
    } else if (method === 'outlook') {
      window.open(`https://outlook.live.com/mail/0/deeplink/compose?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`, '_blank');
    }
    handleClose();
  };

  const handleClose = () => {
    setStep('form');
    setInviteUrl('');
    setCopied(false);
    setError('');
    setFormData({ name: '', email: '', role: '', department: '', balance: 22, tenureMonths: 0 });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-radius shadow-xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-display font-bold text-text">
            {step === 'success' ? 'Convite Criado' : 'Novo Colaborador'}
          </h2>
          <button onClick={handleClose} className="text-text-muted hover:text-text transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {step === 'form' || step === 'loading' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <p className="text-xs text-danger bg-danger/5 border border-danger/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text uppercase tracking-wider">Nome Completo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Ana Silva"
                    className="w-full px-3 py-2 border border-border rounded-radius-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary-light/20 focus:border-primary-light"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text uppercase tracking-wider">
                    Email <span className="text-text-muted font-normal normal-case">(opcional)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="ana@empresa.cv"
                    className="w-full px-3 py-2 border border-border rounded-radius-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary-light/20 focus:border-primary-light"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text uppercase tracking-wider">Departamento</label>
                  <select
                    className="w-full px-3 py-2 border border-border rounded-radius-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary-light/20 focus:border-primary-light"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  >
                    <option value="">Escolher…</option>
                    {deptList.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text uppercase tracking-wider">Cargo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Designer"
                    className="w-full px-3 py-2 border border-border rounded-radius-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary-light/20 focus:border-primary-light"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text uppercase tracking-wider">Dias Base</label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    className="w-full px-3 py-2 border border-border rounded-radius-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary-light/20 focus:border-primary-light"
                    value={formData.balance}
                    onChange={(e) => setFormData({ ...formData, balance: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text uppercase tracking-wider">Antiguidade (meses)</label>
                  <input
                    type="number"
                    min={0}
                    className="w-full px-3 py-2 border border-border rounded-radius-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary-light/20 focus:border-primary-light"
                    value={formData.tenureMonths}
                    onChange={(e) => setFormData({ ...formData, tenureMonths: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-semibold text-text-muted hover:text-text hover:bg-bg rounded-radius-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={step === 'loading'}
                  className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-radius-sm hover:bg-primary-light shadow-md transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {step === 'loading' && (
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  {step === 'loading' ? 'A criar…' : 'Gerar Convite'}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-lg font-bold text-text mb-2">Convite Criado!</h3>
              <p className="text-xs text-text-muted mb-5 max-w-[280px] mx-auto leading-relaxed">
                Partilha este link com <strong>{formData.name}</strong>. O convite expira em 7 dias.
              </p>

              {/* Copy link box */}
              <div className="flex items-center gap-2 mb-6 p-2 bg-bg border border-border rounded-xl">
                <p className="flex-1 text-xs text-text-muted truncate pl-1 text-left font-mono">
                  {inviteUrl}
                </p>
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex-shrink-0 ${
                    copied
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-primary text-white hover:bg-primary-light'
                  }`}
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleShare('whatsapp')}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#25D366] text-white text-sm font-bold rounded-lg hover:shadow-lg transition-all active:scale-[0.98]"
                >
                  <MessageSquare size={18} /> Enviar via WhatsApp
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleShare('gmail')}
                    className="flex items-center justify-center gap-2 py-3 border border-border text-text text-sm font-bold rounded-lg hover:bg-bg transition-all active:scale-[0.98]"
                  >
                    <Mail size={16} /> Gmail
                  </button>
                  <button
                    onClick={() => handleShare('outlook')}
                    className="flex items-center justify-center gap-2 py-3 border border-border text-text text-sm font-bold rounded-lg hover:bg-bg transition-all active:scale-[0.98]"
                  >
                    <Mail size={16} /> Outlook
                  </button>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="w-full mt-6 text-xs font-bold text-text-muted hover:text-text transition-colors"
              >
                Voltar ao diretório
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InviteModal;
