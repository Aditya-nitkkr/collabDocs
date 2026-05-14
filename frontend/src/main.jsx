import { createRoot } from 'react-dom/client'
import './index.css'
import { AuthProvider } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext';
import App from './App.jsx';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter } from 'react-router-dom';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <Toaster position="top-right" reverseOrder={false} />

      <SocketProvider>
        <App />
      </SocketProvider>

      
    </AuthProvider>
  </BrowserRouter>
)
