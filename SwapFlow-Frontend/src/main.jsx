import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom'; // Import BrowserRouter
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { SolanaProvider } from './contexts/SolanaContext.jsx';
import { ThemeProvider } from './contexts/ThemeContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>  {/* Wrap your App with Router */}
    <AuthProvider>
      <SolanaProvider>
        <ThemeProvider>

      <App />
        </ThemeProvider>

      </SolanaProvider>
    </AuthProvider>
    </Router>

  </StrictMode>,
);
