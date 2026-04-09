import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LogIn, Lock, Mail, Eye, EyeOff, User, Building2, ArrowLeft, Hash } from 'lucide-react';
import { validateNIF } from '../utils/nifValidation';

const Login = () => {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState(searchParams.get('signup') === 'true' ? 'signup' : 'login');

  // Login state
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe]   = useState(false);
  const [resetSent, setResetSent]     = useState(false);

  // Signup state
  const [signupName, setSignupName]         = useState('');
  const [signupCompany, setSignupCompany]   = useState('');
  const [signupNif, setSignupNif]           = useState('');
  const [signupEmail, setSignupEmail]       = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm]   = useState('');
  const [showSignupPass, setShowSignupPass] = useState(false);
  const [signupDone, setSignupDone]         = useState(false);
  const [tosAccepted, setTosAccepted]       = useState(false);
  const [nifError, setNifError]             = useState('');

  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [info, setInfo]         = useState(null);
  const navigate = useNavigate();

  // Clear errors when switching mode
  useEffect(() => { setError(null); setInfo(null); setResetSent(false); }, [mode]);

  // ── Forgot password ─────────────────────────────────────────────────────────
  const handleForgotPassword = async () => {
    if (!email) { setInfo('Introduz o teu email acima para recuperar a palavra-passe.'); return; }
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw resetError;
      setResetSent(true);
      setError(null);
    } catch {
      setError('Erro ao enviar email de recuperação. Verifica o endereço e tenta novamente.');
    }
  };

  // ── Login ────────────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, company_id')
        .eq('id', data.user.id)
        .single();

      // Founder confirmed email but setup_company_admin() was never called
      if (!profile?.company_id) {
        navigate('/setup-company', { replace: true });
        return;
      }

      const role = profile?.role || 'employee';
      navigate(role === 'manager' || role === 'admin' ? '/manager-dashboard' : '/worker-dashboard', { replace: true });
    } catch {
      setError('Email ou palavra-passe incorretos.');
    } finally {
      setLoading(false);
    }
  };

  // ── Sign Up ──────────────────────────────────────────────────────────────────
  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);

    if (signupPassword !== signupConfirm) {
      setError('As palavras-passe não coincidem.');
      return;
    }
    if (signupPassword.length < 6) {
      setError('A palavra-passe deve ter pelo menos 6 caracteres.');
      return;
    }

    if (!validateNIF(signupNif)) {
      setNifError('NIF deve ter exactamente 9 dígitos');
      return;
    }
    setNifError('');
    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: { data: { full_name: signupName } },
      });
      if (signUpError) throw signUpError;

      if (data.session) {
        // Email confirmation disabled — set up company immediately
        const { error: rpcError } = await supabase.rpc('setup_company_admin', {
          p_company_name: signupCompany,
          p_full_name: signupName,
          p_nif: signupNif || null,
        });
        if (rpcError) throw rpcError;
        navigate('/manager-dashboard', { replace: true });
      } else {
        // Email confirmation required — show success message
        setSignupDone(true);
      }
    } catch (err) {
      if (err.message?.includes('already registered')) {
        setError('Este email já está registado. Inicia sessão em vez disso.');
      } else {
        setError(err.message || 'Erro ao criar conta. Tenta novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex bg-bg font-sans">
      {/* Left side — Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-10">
        <div className="w-full max-w-[440px]">

          {/* Back to landing */}
          <button
            onClick={() => navigate('/', { replace: true })}
            className="flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-primary transition-colors mb-8 group"
          >
            <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" />
            Voltar ao início
          </button>

          <div className="bg-white p-8 md:p-10 rounded-radius shadow-lg border border-border">
            {/* Logo */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="w-10 h-10 bg-accent rounded-radius-sm flex items-center justify-center text-xl shadow-md shadow-accent/25">
                🌴
              </div>
              <span className="font-display font-bold text-xl text-primary">
                Nha <span className="text-accent">Féria</span>
              </span>
            </div>

            {/* Mode toggle */}
            <div className="flex bg-bg rounded-radius-sm p-1 mb-8 border border-border">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${
                  mode === 'login'
                    ? 'bg-white shadow-sm text-primary border border-border'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${
                  mode === 'signup'
                    ? 'bg-white shadow-sm text-primary border border-border'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                Criar conta
              </button>
            </div>

            {/* Error / success banners */}
            {error && (
              <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-danger text-sm font-semibold rounded-radius-sm text-center">
                {error}
              </div>
            )}
            {info && (
              <div className="mb-5 p-3.5 bg-blue-50 border border-blue-200 text-blue-700 text-sm font-semibold rounded-radius-sm text-center">
                {info}
              </div>
            )}
            {resetSent && (
              <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold rounded-radius-sm text-center">
                Email de recuperação enviado! Verifica a tua caixa de entrada.
              </div>
            )}

            {/* ── LOGIN FORM ─────────────────────────────────────────────────── */}
            {mode === 'login' && (
              <>
                <div className="text-center mb-7">
                  <h1 className="text-xl font-bold mb-1">Bem-vindo de volta</h1>
                  <p className="text-sm text-text-muted">Acede à gestão de férias da tua equipa.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-text-muted" htmlFor="email">
                      Endereço de Email
                    </label>
                    <div className="relative">
                      <input
                        id="email"
                        type="email"
                        placeholder="ex: maria@empresa.cv"
                        className="w-full pl-10 pr-4 py-3 bg-bg border border-border rounded-radius-sm text-sm focus:outline-none focus:border-primary-light focus:ring-4 focus:ring-primary-light/10 transition-all"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                      <Mail className="absolute left-3 top-3.5 w-4 h-4 text-text-light" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-text-muted" htmlFor="password">
                      Palavra-passe
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-3 bg-bg border border-border rounded-radius-sm text-sm focus:outline-none focus:border-primary-light focus:ring-4 focus:ring-primary-light/10 transition-all"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <Lock className="absolute left-3 top-3.5 w-4 h-4 text-text-light" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3.5 text-text-light hover:text-primary transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-primary-light focus:ring-primary-light transition-all"
                      />
                      <span className="text-xs text-text-muted group-hover:text-text transition-colors">Lembrar-me</span>
                    </label>
                    <button type="button" onClick={handleForgotPassword} className="text-xs font-semibold text-primary-light hover:underline transition-all">
                      Esqueceu a senha?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-primary text-white text-sm font-semibold rounded-radius-sm hover:bg-[#122B45] hover:-translate-y-px hover:shadow-md active:translate-y-0 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed font-display"
                  >
                    {loading ? 'Entrando...' : 'Entrar na plataforma'}
                  </button>
                </form>

                <p className="mt-6 text-center text-xs text-text-muted">
                  Ainda não tem conta?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="font-bold text-primary-light hover:underline"
                  >
                    Criar conta grátis
                  </button>
                </p>
              </>
            )}

            {/* ── SIGN UP FORM ───────────────────────────────────────────────── */}
            {mode === 'signup' && !signupDone && (
              <>
                <div className="text-center mb-7">
                  <h1 className="text-xl font-bold mb-1">Cria a tua conta</h1>
                  <p className="text-sm text-text-muted">Começa grátis — sem cartão de crédito.</p>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-text-muted" htmlFor="signup-name">
                      O teu nome completo
                    </label>
                    <div className="relative">
                      <input
                        id="signup-name"
                        type="text"
                        placeholder="ex: Maria Santos"
                        className="w-full pl-10 pr-4 py-3 bg-bg border border-border rounded-radius-sm text-sm focus:outline-none focus:border-primary-light focus:ring-4 focus:ring-primary-light/10 transition-all"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        required
                      />
                      <User className="absolute left-3 top-3.5 w-4 h-4 text-text-light" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-text-muted" htmlFor="signup-company">
                      Nome da empresa
                    </label>
                    <div className="relative">
                      <input
                        id="signup-company"
                        type="text"
                        placeholder="ex: Transportes Maio Lda"
                        className="w-full pl-10 pr-4 py-3 bg-bg border border-border rounded-radius-sm text-sm focus:outline-none focus:border-primary-light focus:ring-4 focus:ring-primary-light/10 transition-all"
                        value={signupCompany}
                        onChange={(e) => setSignupCompany(e.target.value)}
                        required
                      />
                      <Building2 className="absolute left-3 top-3.5 w-4 h-4 text-text-light" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-text-muted" htmlFor="signup-nif">
                      NIF da empresa
                      <span className="ml-1.5 text-[10px] font-normal text-text-light normal-case tracking-normal">(opcional — necessário para faturação electrónica)</span>
                    </label>
                    <div className="relative">
                      <input
                        id="signup-nif"
                        type="text"
                        inputMode="numeric"
                        placeholder="ex: 200123456"
                        className="w-full pl-10 pr-4 py-3 bg-bg border border-border rounded-radius-sm text-sm focus:outline-none focus:border-primary-light focus:ring-4 focus:ring-primary-light/10 transition-all"
                        value={signupNif}
                        onChange={(e) => setSignupNif(e.target.value)}
                      />
                      <Hash className="absolute left-3 top-3.5 w-4 h-4 text-text-light" />
                    </div>
                    {nifError && <p className="text-[11px] text-red-600 font-semibold mt-1">{nifError}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-text-muted" htmlFor="signup-email">
                      Email profissional
                    </label>
                    <div className="relative">
                      <input
                        id="signup-email"
                        type="email"
                        placeholder="ex: maria@empresa.cv"
                        className="w-full pl-10 pr-4 py-3 bg-bg border border-border rounded-radius-sm text-sm focus:outline-none focus:border-primary-light focus:ring-4 focus:ring-primary-light/10 transition-all"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        required
                      />
                      <Mail className="absolute left-3 top-3.5 w-4 h-4 text-text-light" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-text-muted" htmlFor="signup-password">
                      Palavra-passe
                    </label>
                    <div className="relative">
                      <input
                        id="signup-password"
                        type={showSignupPass ? 'text' : 'password'}
                        placeholder="mínimo 6 caracteres"
                        className="w-full pl-10 pr-10 py-3 bg-bg border border-border rounded-radius-sm text-sm focus:outline-none focus:border-primary-light focus:ring-4 focus:ring-primary-light/10 transition-all"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                      />
                      <Lock className="absolute left-3 top-3.5 w-4 h-4 text-text-light" />
                      <button
                        type="button"
                        onClick={() => setShowSignupPass(!showSignupPass)}
                        className="absolute right-3 top-3.5 text-text-light hover:text-primary transition-colors"
                      >
                        {showSignupPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-text-muted" htmlFor="signup-confirm">
                      Confirmar palavra-passe
                    </label>
                    <div className="relative">
                      <input
                        id="signup-confirm"
                        type={showSignupPass ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-3 bg-bg border border-border rounded-radius-sm text-sm focus:outline-none focus:border-primary-light focus:ring-4 focus:ring-primary-light/10 transition-all"
                        value={signupConfirm}
                        onChange={(e) => setSignupConfirm(e.target.value)}
                        required
                      />
                      <Lock className="absolute left-3 top-3.5 w-4 h-4 text-text-light" />
                    </div>
                  </div>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={tosAccepted}
                      onChange={e => setTosAccepted(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-gray-300 text-primary-light focus:ring-primary-light flex-shrink-0"
                    />
                    <span className="text-[11px] text-text-muted leading-relaxed">
                      Li e aceito os{' '}
                      <a href="/terms" target="_blank" className="font-semibold text-primary-light hover:underline">Termos de Serviço</a>
                      {' '}e a{' '}
                      <a href="/privacy" target="_blank" className="font-semibold text-primary-light hover:underline">Política de Privacidade</a>.
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={loading || !tosAccepted}
                    className="w-full py-3.5 bg-accent text-primary text-sm font-bold rounded-radius-sm hover:bg-accent-hover hover:-translate-y-px hover:shadow-md active:translate-y-0 shadow-sm shadow-accent/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-display mt-2"
                  >
                    {loading ? 'A criar conta...' : 'Criar conta grátis →'}
                  </button>
                </form>

                <p className="mt-5 text-center text-xs text-text-muted">
                  Já tens conta?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="font-bold text-primary-light hover:underline"
                  >
                    Iniciar sessão
                  </button>
                </p>
              </>
            )}

            {/* ── EMAIL CONFIRMATION PENDING ─────────────────────────────────── */}
            {mode === 'signup' && signupDone && (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-emerald-100">
                  <Mail className="w-7 h-7 text-emerald-600" />
                </div>
                <h2 className="text-lg font-bold mb-2">Verifica o teu email</h2>
                <p className="text-sm text-text-muted mb-6 leading-relaxed">
                  Enviámos um link de confirmação para <span className="font-semibold text-text">{signupEmail}</span>.
                  Clica no link para activar a tua conta.
                </p>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-sm font-semibold text-primary-light hover:underline"
                >
                  Já confirmei — iniciar sessão
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right side — Branding */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary to-[#0F2033] text-white flex-col items-center justify-center p-16 text-center">
        <div className="text-8xl mb-8">🏖️</div>
        <h2 className="text-3xl font-bold font-display leading-tight mb-6">
          Trabalho organizado,<br />Férias descansadas.
        </h2>
        <p className="text-lg opacity-80 max-w-[420px] leading-relaxed">
          A Nha Féria centraliza a gestão de ausências e conformidade legal numa plataforma simples e imediata. Desenvolvida para PMEs em Cabo Verde.
        </p>
        <div className="mt-10 grid grid-cols-3 gap-6 text-center">
          {[
            { val: 'Grátis', label: 'para começar' },
            { val: '22', label: 'dias legais CV' },
            { val: '100%', label: 'conforme com a lei' },
          ].map(s => (
            <div key={s.label}>
              <div className="text-2xl font-bold text-accent tabular-nums">{s.val}</div>
              <div className="text-xs text-white/50 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Login;
