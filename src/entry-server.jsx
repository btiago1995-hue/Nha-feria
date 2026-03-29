import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { LanguageProvider } from './lib/LanguageContext';
import LandingPage from './pages/LandingPage';

export function render() {
  return renderToString(
    <LanguageProvider>
      <StaticRouter location="/">
        <LandingPage />
      </StaticRouter>
    </LanguageProvider>
  );
}
