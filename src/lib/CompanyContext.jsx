import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';
import { getDepartments } from './sectors';

const CompanyContext = createContext(null);

export const CompanyProvider = ({ profile, children }) => {
  const [company,      setCompany]      = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  const fetchCompany = async () => {
    if (!profile?.company_id) { setLoading(false); return; }
    setError(null);
    try {
      const [{ data: companyData, error: compErr }, { data: subData }] = await Promise.all([
        supabase.from('companies').select('*').eq('id', profile.company_id).single(),
        supabase.from('subscriptions').select('*').eq('company_id', profile.company_id).maybeSingle(),
      ]);
      if (compErr) { setError(compErr); setCompany(null); }
      else { setCompany(companyData || null); setSubscription(subData || null); }
    } catch (err) {
      setError(err);
      setCompany(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCompany(); }, [profile?.company_id]);

  const departments = getDepartments(company?.sector);

  // Subscription is accessible if: trialing (within trial) OR active
  const subStatus = subscription?.status || 'trialing';
  const trialEnded = subscription?.trial_ends_at
    ? new Date(subscription.trial_ends_at) < new Date()
    : false;
  const isSubscriptionActive =
    subStatus === 'active' ||
    (subStatus === 'trialing' && !trialEnded);

  return (
    <CompanyContext.Provider value={{
      company, subscription, departments, loading, error,
      isSubscriptionActive, subStatus, trialEnded,
      refetch: fetchCompany,
    }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => useContext(CompanyContext);
