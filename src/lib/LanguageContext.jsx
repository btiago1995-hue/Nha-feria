import React, { createContext, useContext, useState } from 'react';
import { translations } from './translations';

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    if (typeof localStorage === 'undefined') return 'pt';
    return localStorage.getItem('nha-feria-lang') || 'pt';
  });

  const switchLang = (l) => {
    if (typeof localStorage !== 'undefined') localStorage.setItem('nha-feria-lang', l);
    setLang(l);
  };

  const t = (section, key, vars = {}) => {
    const str = translations[lang]?.[section]?.[key] ?? translations['pt']?.[section]?.[key] ?? key;
    return Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, v), str);
  };

  return (
    <LanguageContext.Provider value={{ lang, switchLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
