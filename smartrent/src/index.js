import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import './utils/installApp'; // capture the install prompt as early as possible

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // Router outside the boundary, so the error screen's links still work.
  <BrowserRouter>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </BrowserRouter>
);

serviceWorkerRegistration.register();
