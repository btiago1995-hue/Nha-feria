import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle2, AlertCircle, Eye, EyeOff, Hash, CreditCard, CalendarDays, Briefcase } from 'lucide-react';

const InvitePage = () => {
  const { token } = useParams();
  const navigate  = useNavigate();

  const [invite, setInvite]       = useState(null);
  const [status, setStatus]       = useState('loading'); // loading | ready | expired | used | success | error
  const [showPass, setShowPass]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg]   = useState('');
  const [formData, setFormData]   = useState({ email: '', password: '', confirm: '', nif: '', cni: '', hire_date: '', job_title: '' });

  // ── Fetch invite by token ──
  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('company_invites')
        .select('*')
        .eq('token', token)
        .single();

      if (error || !data) { setStatus('expired'); return; }
      if (data.used_at)   { setStatus('used');    return; }
      if (new Date(data.expires_at) < new Date()) { setStatus('expired'); return; }

      setInvite(data);
      setFormData(prev => ({
        ...prev,
        nif: data.nif || '',
        cni: data.cni || '',
      }));
      setStatus('ready');
    };
    load();
  }, [token]);

  // ── Submit handler ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (formData.password !== formData.confirm) {
      setErrorMsg('As palavras-passe não coincidem.');
      return;
    }
    if (formData.password.length < 6) {
      setErrorMsg('A palavra-passe deve ter pelo menos 6 caracteres.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Sign up the new user
      const { data: authData, error: signUpErr } = await supabase.auth.signUp({
        email:    formData.email,
        password: formData.password,
        options: {
          // invite_token lets the DB trigger apply company/dept/balance even after email confirmation
          data: {
            full_name:    invite.full_name,
            invite_token: token,
            nif:          formData.nif.trim()       || null,
            cni:          formData.cni.trim()       || null,
            hire_date:    formData.hire_date        || null,
            job_title:    formData.job_title.trim() || null,
          },
          emailRedirectTo: `${window.location.origin}/worker-dashboard`,
        },
      });

      if (signUpErr) throw signUpErr;

      const userId = authData.user?.id;
      if (!userId) throw new Error('Não foi possível criar a conta.');

      // 2. If we have an immediate session (email confirmation disabled), enrich the profile
      if (authData.session) {
        await supabase.from('profiles').update({
          full_name:        invite.full_name,
          department:       invite.department,
          vacation_balance: invite.vacation_balance,
          company_id:       invite.company_id,
          nif:              formData.nif.trim()       || null,
          cni:              formData.cni.trim()       || null,
          hire_date:        formData.hire_date        || null,
          job_title:        formData.job_title.trim() || null,
        }).eq('id', userId);

        // 3. Mark invite as used
        await supabase
          .from('company_invites')
          .update({ used_at: new Date().toISOString() })
          .eq('token', token);

        setStatus('success');
        setTimeout(() => navigate('/worker-dashboard'), 2500);
      } else {
        // Email confirmation is required — mark invite used optimistically
        // The profile update will happen on first sign-in via a separate mechanism
        await supabase
          .from('company_invites')
          .update({ used_at: new Date().toISOString() })
          .eq('token', token);

        setStatus('success');
      }
    } catch (err) {
      console.error('Signup error:', err);
      setErrorMsg(
        err.message?.includes('already registered')
          ? 'Este email já está registado. Vai para o login.'
          : err.message || 'Erro ao criar conta. Tenta novamente.'
      );
      setSubmitting(false);
    }
  };

  // ── Render states ──
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (status === 'expired' || status === 'used') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <div className="bg-white rounded-radius shadow-xl p-8 max-w-sm w-full text-center">
          <div className="w-14 h-14 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} className="text-danger" />
          </div>
          <h2 className="text-lg font-bold text-text mb-2">
            {status === 'used' ? 'Convite já utilizado' : 'Convite expirado'}
          </h2>
          <p className="text-sm text-text-muted mb-6">
            {status === 'used'
              ? 'Este link de convite já foi utilizado. Pede ao teu gestor um novo convite.'
              : 'Este link de convite expirou (validade de 7 dias). Pede ao teu gestor para gerar um novo.'}
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-2.5 bg-primary text-white text-sm font-bold rounded-radius-sm hover:bg-primary-light transition-all"
          >
            Ir para o Login
          </button>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <div className="bg-white rounded-radius shadow-xl p-8 max-w-sm w-full text-center">
          <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={28} className="text-emerald-500" />
          </div>
          <h2 className="text-lg font-bold text-text mb-2">Conta criada!</h2>
          <p className="text-sm text-text-muted">
            Verifica o teu email para confirmar a conta e aceder à Nha Féria.
          </p>
        </div>
      </div>
    );
  }

  // ── Main form ──
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="bg-white rounded-radius shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary to-primary-light px-8 py-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-primary text-xl shadow-lg">
              🌴
            </div>
            <span className="font-display font-bold text-lg">
              Nha <span className="text-accent">Féria</span>
            </span>
          </div>
          <h1 className="text-xl font-bold leading-tight mb-1">
            Bem-vindo, {invite?.full_name?.split(' ')[0]}!
          </h1>
          <p className="text-sm text-white/70">
            O teu gestor convidou-te. Cria a tua conta para começar.
          </p>
        </div>

        {/* Pre-filled info badge */}
        {(invite?.role_label || invite?.department) && (
          <div className="px-8 py-4 bg-primary/5 border-b border-border flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {invite.full_name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-text">{invite.full_name}</p>
              <p className="text-xs text-text-muted">
                {[invite.role_label, invite.department].filter(Boolean).join(' · ')}
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
          {errorMsg && (
            <div className="flex items-start gap-2 bg-danger/5 border border-danger/20 rounded-xl p-3">
              <AlertCircle size={15} className="text-danger flex-shrink-0 mt-0.5" />
              <p className="text-xs text-danger">{errorMsg}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text uppercase tracking-wider">Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="o.teu@email.com"
              className="w-full px-4 py-3 border border-border rounded-radius-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary-light/20 focus:border-primary-light transition-colors"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
              <Hash size={12} /> NIF Pessoal
              <span className="font-normal text-[10px] text-text-muted normal-case tracking-normal">(necessário para a folha de salários)</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Ex: 200123456"
              className="w-full px-4 py-3 border border-border rounded-radius-sm text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-light/20 focus:border-primary-light transition-colors"
              value={formData.nif}
              onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard size={12} /> CNI
              <span className="font-normal text-[10px] text-text-muted normal-case tracking-normal">(Cartão Nacional de Identificação)</span>
            </label>
            <input
              type="text"
              autoComplete="off"
              placeholder="Ex: A123456"
              className="w-full px-4 py-3 border border-border rounded-radius-sm text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-light/20 focus:border-primary-light transition-colors"
              value={formData.cni}
              onChange={(e) => setFormData({ ...formData, cni: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
                <CalendarDays size={12} /> Data de Admissão
              </label>
              <input
                type="date"
                className="w-full px-4 py-3 border border-border rounded-radius-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary-light/20 focus:border-primary-light transition-colors"
                value={formData.hire_date}
                onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase size={12} /> Função
              </label>
              <input
                type="text"
                placeholder="Ex: Técnico de TI"
                className="w-full px-4 py-3 border border-border rounded-radius-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary-light/20 focus:border-primary-light transition-colors"
                value={formData.job_title}
                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text uppercase tracking-wider">Palavra-passe</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                required
                autoComplete="new-password"
                placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-3 pr-11 border border-border rounded-radius-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary-light/20 focus:border-primary-light transition-colors"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text uppercase tracking-wider">Confirmar Palavra-passe</label>
            <input
              type={showPass ? 'text' : 'password'}
              required
              autoComplete="new-password"
              placeholder="Repete a palavra-passe"
              className="w-full px-4 py-3 border border-border rounded-radius-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary-light/20 focus:border-primary-light transition-colors"
              value={formData.confirm}
              onChange={(e) => setFormData({ ...formData, confirm: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-primary text-white text-sm font-bold rounded-radius-sm hover:bg-primary-light shadow-md transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
          >
            {submitting && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {submitting ? 'A criar conta…' : 'Criar Conta'}
          </button>

          <p className="text-center text-xs text-text-muted pt-1">
            Já tens conta?{' '}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-primary-light font-semibold hover:underline"
            >
              Iniciar Sessão
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default InvitePage;
