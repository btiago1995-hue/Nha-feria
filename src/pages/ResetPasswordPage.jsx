import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [status, setStatus]         = useState('form'); // 'form' | 'saving' | 'success' | 'invalid'
  const [error, setError]           = useState('');
  const [sessionReady, setSessionReady] = useState(false);

  // Supabase sends the recovery token as a URL fragment (#access_token=...&type=recovery)
  // The client SDK picks this up automatically and fires PASSWORD_RECOVERY
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true);
      }
    });

    // Also check if we already have a valid session (e.g. page refresh after token consumed)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('As palavras-passe não coincidem.');
      return;
    }
    if (password.length < 6) {
      setError('A palavra-passe deve ter pelo menos 6 caracteres.');
      return;
    }

    setStatus('saving');
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message || 'Erro ao atualizar palavra-passe.');
      setStatus('form');
      return;
    }

    setStatus('success');
    setTimeout(() => navigate('/login'), 3000);
  };

  // Token not found / invalid link
  if (!sessionReady && status === 'form') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <div className="bg-white rounded-radius shadow-xl p-8 max-w-sm w-full text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Lock size={22} className="text-primary" />
          </div>
          <h2 className="text-base font-bold text-text mb-2">A verificar link…</h2>
          <p className="text-xs text-text-muted">Se o link expirou, pede um novo email de recuperação.</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-5 text-xs font-semibold text-primary-light hover:underline"
          >
            Voltar ao login
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
          <h2 className="text-lg font-bold text-text mb-2">Palavra-passe atualizada!</h2>
          <p className="text-sm text-text-muted">Vais ser redirecionado para o login em instantes…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="bg-white rounded-radius shadow-xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary to-primary-light px-8 py-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center text-primary text-lg shadow-lg">
              🌴
            </div>
            <span className="font-display font-bold">Nha <span className="text-accent">Féria</span></span>
          </div>
          <h1 className="text-xl font-bold mb-1">Nova Palavra-passe</h1>
          <p className="text-sm text-white/70">Escolhe uma nova palavra-passe segura.</p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2 bg-danger/5 border border-danger/20 rounded-xl p-3">
              <AlertCircle size={15} className="text-danger flex-shrink-0 mt-0.5" />
              <p className="text-xs text-danger">{error}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text uppercase tracking-wider">Nova Palavra-passe</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                required
                autoComplete="new-password"
                placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-3 pr-11 border border-border rounded-radius-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary-light/20 focus:border-primary-light transition-colors"
                value={password}
                onChange={e => setPassword(e.target.value)}
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
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={status === 'saving'}
            className="w-full py-3 bg-primary text-white text-sm font-bold rounded-radius-sm hover:bg-primary-light shadow-md transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
          >
            {status === 'saving' && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {status === 'saving' ? 'A guardar…' : 'Definir Nova Palavra-passe'}
          </button>

          <p className="text-center text-xs text-text-muted pt-1">
            <button type="button" onClick={() => navigate('/login')} className="text-primary-light font-semibold hover:underline">
              Voltar ao Login
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
