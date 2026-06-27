import React from 'react';
import { useAuth } from '../lib/AuthContext';
import { MOCK_USERS } from '../lib/db';
import { useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (id: string) => {
    login(id);
    navigate('/');
  };

  return (
    <div className="app-container" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div className="logo" style={{ fontSize: '2rem' }}>
            <FileText size={32} color="var(--primary-color)" />
            Ajaia Docs
          </div>
        </div>
        <h2 style={{ marginBottom: '0.5rem' }}>Welcome Back</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Select a user to continue</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {MOCK_USERS.map(user => (
            <button 
              key={user.id} 
              className="btn btn-secondary" 
              style={{ width: '100%', justifyContent: 'flex-start', padding: '1rem' }}
              onClick={() => handleLogin(user.id)}
            >
              {user.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
