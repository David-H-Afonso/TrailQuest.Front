import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource-variable/bricolage-grotesque/wght.css';
import '@fontsource-variable/dm-sans/wght.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import App from './App';
import { store } from './store';
import { ErrorBoundary } from './components/elements/ErrorBoundary';
import './styles/app.scss';
import './styles/expansion.scss';

createRoot(document.getElementById('root')!).render(
  <StrictMode><ErrorBoundary><Provider store={store}><BrowserRouter><App /></BrowserRouter></Provider></ErrorBoundary></StrictMode>,
);
