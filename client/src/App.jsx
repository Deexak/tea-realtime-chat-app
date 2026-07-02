import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Login from './components/Login';
import Register from './components/Register';
import ChatRoom from './components/ChatRoom';
import GridScan from './components/GridScan';
import { Loader2 } from 'lucide-react';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div 
        style={{ 
          height: '100vh', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          background: 'var(--bg-gradient)',
          color: 'var(--text-main)',
          gap: '16px'
        }}
      >
        <Loader2 className="animate-spin" size={48} style={{ color: 'var(--primary)' }} />
        <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '500' }}>
          Restoring session...
        </span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Redirect logged in users away from auth pages
const AuthRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function AppContent() {
  const { user, loading } = useAuth();
  const [scanDone, setScanDone] = React.useState(false);
  const [scanStatus, setScanStatus] = React.useState('INITIALIZING CYBERNETIC SCAN...');

  React.useEffect(() => {
    if (!loading) {
      const t1 = setTimeout(() => setScanStatus('ANALYZING RETINA & BIOMETRICS...'), 800);
      const t2 = setTimeout(() => setScanStatus('DECRYPTING RETRO CHANNEL PACKETS...'), 1600);
      const t3 = setTimeout(() => setScanStatus('ESTABLISHING SECURE SOCKETS...'), 2400);
      const t4 = setTimeout(() => setScanStatus('ACCESS GRANTED. WELCOME TO TEA DIRECT.'), 3200);
      const t5 = setTimeout(() => setScanDone(true), 4000);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
        clearTimeout(t5);
      };
    }
  }, [loading]);

  if (loading) {
    return (
      <div 
        style={{ 
          height: '100vh', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          background: 'var(--bg-gradient)',
          color: 'var(--text-main)',
          gap: '16px'
        }}
      >
        <Loader2 className="animate-spin" size={48} style={{ color: 'var(--primary)' }} />
        <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '500' }}>
          Restoring session...
        </span>
      </div>
    );
  }

  if (!scanDone) {
    return (
      <div className="scan-screen" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: '#000000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        overflow: 'hidden'
      }}>
        <GridScan
          sensitivity={0.65}
          lineThickness={1.2}
          linesColor="#1a0404"
          gridScale={0.07}
          scanColor="#ef4444"
          scanOpacity={0.6}
          enablePost={true}
          bloomIntensity={1.2}
          chromaticAberration={0.003}
          noiseIntensity={0.025}
          enableWebcam={true}
          showPreview={false}
        />
        
        {/* Holographic scanner dialog */}
        <div className="glass-panel" style={{
          position: 'absolute',
          padding: '30px 40px',
          textAlign: 'center',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          boxShadow: '0 0 40px rgba(239, 68, 68, 0.15)',
          background: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          maxWidth: '400px',
          width: '90%'
        }}>
          <h1 style={{
            fontSize: '24px',
            fontWeight: '800',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#ffffff',
            margin: 0,
            textShadow: '0 0 10px rgba(239, 68, 68, 0.5)'
          }}>
            Tea Direct
          </h1>
          <div style={{
            height: '2px',
            width: '60px',
            background: '#ef4444',
            boxShadow: '0 0 8px #ef4444'
          }} />
          <p style={{
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: '12px',
            letterSpacing: '0.1em',
            color: '#ef4444',
            margin: 0,
            animation: 'pulse 1.5s infinite ease-in-out'
          }}>
            {scanStatus}
          </p>
        </div>
      </div>
    );
  }

  return (
    <SocketProvider>
      <Router>
        <Routes>
          <Route 
            path="/login" 
            element={
              <AuthRoute>
                <Login />
              </AuthRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <AuthRoute>
                <Register />
              </AuthRoute>
            } 
          />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <ChatRoom />
              </ProtectedRoute>
            } 
          />
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </SocketProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
