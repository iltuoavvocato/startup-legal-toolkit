import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { currentRouterPath, prefetchOnIntent, preloadPath } from './routePages';
import './styles/fonts.css';
import './styles/global.css';
import './styles/match.css';

const base = import.meta.env.BASE_URL;

// The current page's chunk first (already modulepreloaded by the prerendered HTML), then the first render.
void preloadPath(currentRouterPath(base)).then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter basename={base}>
        <App />
      </BrowserRouter>
    </StrictMode>,
  );
  prefetchOnIntent(base);
});
