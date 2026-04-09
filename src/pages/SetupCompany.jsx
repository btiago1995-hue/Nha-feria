import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Building2, Hash } from 'lucide-react';

// Shown when a founder confirmed their email but setup_company_admin() was never called.
// This happens when Supabase email confirmation is enabled: signUp() returns no session,
// so Login.jsx can't call setup_company_admin() immediately. The user confirms email,
// logs in, and is redirected here to finish the setup.

const SetupCompany = () => {
  const [companyName, setCompanyName] = useState('');
  const [nif, setNif]                 = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!companyName.trim()) { setError('Introduz o nome da empresa.'); return; }

    setLoading(true);
    setError(null);
    try {
      const { error: rpcError } = await supabase.rpc('setup_company_admin', {
        p_company_name: companyName.trim(),
        p_nif: nif.trim() || null,
      });
      if (rpcError) throw rpcError;
      navigate('/manager-dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Erro ao configurar empresa. Tenta novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-border p-8 space-y-6">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Building2 className="text-primary" size={24} />
          </div>
          <h1 className="text-xl font-bold text-text">Configura a tua empresa</h1>
          <p className="text-sm text-text-muted">Só mais um passo para começares a usar o Nha Féria.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Nome da empresa
            </label>
            <div className="relative">
              <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="Ex: Nha Féria Lda"
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              NIF da empresa <span className="font-normal normal-case">(opcional)</span>
            </label>
            <div className="relative">
              <Hash size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={nif}
                onChange={e => setNif(e.target.value)}
                placeholder="Ex: 200123456"
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'A configurar...' : 'Criar empresa'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetupCompany;
