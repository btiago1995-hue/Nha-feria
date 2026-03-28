import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { LogIn, Lock, Mail, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Introduz o teu email para recuperar a palavra-passe.');
      return;
    }
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
      if (resetError) throw resetError;
      setResetSent(true);
      setError(null);
    } catch (err) {
      setError('Erro ao enviar email de recuperação. Verifica o endereço e tenta novamente.');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // Fetch profile to determine role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        // Fallback to employee or handle error
      }

      const role = profile?.role || 'employee';
      if (role === 'manager' || role === 'admin') {
        navigate('/manager-dashboard');
      } else {
        navigate('/worker-dashboard');
      }
    } catch (err) {
      setError('Email ou palavra-passe incorretos.');
      console.error('Login error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-bg font-sans">
      {/* Left side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-[440px] bg-white p-8 md:p-12 rounded-radius shadow-lg border border-border">
          <div className="flex items-center justify-center gap-3 mb-10">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-light to-primary rounded-radius-sm flex items-center justify-center text-white font-bold text-lg font-display">
              N
            </div>
            <div className="font-display text-2xl font-bold text-primary">Nha Féria</div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Bem-vindo de volta 👋</h1>
            <p className="text-sm text-text-muted">Acesse à gestão inteligente das suas férias.</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-danger text-sm font-semibold rounded-radius-sm text-center">
              {error}
            </div>
          )}
          {resetSent && (
            <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold rounded-radius-sm text-center">
              Email de recuperação enviado! Verifica a tua caixa de entrada.
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-text-muted" htmlFor="email">
                Endereço de Email
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  placeholder="ex: maria@nhaferia.cv"
                  className="w-full pl-10 pr-4 py-3 bg-bg border border-border rounded-radius-sm text-sm focus:outline-none focus:border-primary-light focus:ring-4 focus:ring-primary-light/10 transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-text-light" />
              </div>
            </div>

            <div className="space-y-2">
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
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary-light focus:ring-primary-light transition-all" />
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

          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-xs font-bold text-text mb-2 uppercase tracking-wider">Modo de Produção Activo</p>
            <p className="text-[11px] text-text-muted">
              Se ainda não tem acesso, contacte o administrador da sua empresa.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Illustration/Branding */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary to-[#0F2033] text-white flex-col items-center justify-center p-16 text-center">
        <div className="text-8xl mb-8 animate-bounce">🏖️</div>
        <h2 className="text-3xl font-bold font-display leading-tight mb-6">
          Trabalho organizado,<br />Férias descansadas.
        </h2>
        <p className="text-lg opacity-80 max-w-[420px] leading-relaxed">
          A Nha Féria centraliza a gestão de ausências e conformidade legal numa plataforma simples e imediata. Desenvolvida para PMEs em Cabo Verde.
        </p>
      </div>
    </div>
  );
};

export default Login;
