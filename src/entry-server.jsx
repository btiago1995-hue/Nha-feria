import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { LanguageProvider } from './lib/LanguageContext';
import LandingPage from './pages/LandingPage';
import ContactPage from './pages/ContactPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfUse from './pages/TermsOfUse';

const ROUTE_MAP = {
  '/':         LandingPage,
  '/contacto': ContactPage,
  '/privacy':  PrivacyPolicy,
  '/terms':    TermsOfUse,
};

export function render(location = '/') {
  const Page = ROUTE_MAP[location] ?? LandingPage;
  return renderToString(
    <LanguageProvider>
      <StaticRouter location={location}>
        <Page />
      </StaticRouter>
    </LanguageProvider>
  );
}
