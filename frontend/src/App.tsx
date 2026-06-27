import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { EditorPage } from './pages/Editor';
import './index.css';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/doc/:id" element={<ProtectedRoute><EditorPage /></ProtectedRoute>} />
    </Routes>
  );
}

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <ToastContainer 
          position="bottom-center" 
          autoClose={3000}
          hideProgressBar={true}
          closeButton={false}
          theme="dark"
          toastStyle={{
            backgroundColor: '#1e293b',
            color: '#f8fafc',
            borderRadius: '100px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            padding: '12px 24px',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: 500,
            fontSize: '0.95rem',
            marginBottom: '1rem',
            textAlign: 'center',
            display: 'flex',
            justifyContent: 'center'
          }}
        />
      </Router>
    </AuthProvider>
  );
}

export default App;
