import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  // Show sign up first
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError("Supabase client is not initialized.");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/');
      } else {
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              username: username
            }
          }
        });
        if (error) throw error;
        
        if (data.session) {
          toast.success('Account created successfully!');
          navigate('/');
        } else {
          toast.success('Success! Check your email for the confirmation link.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' // Premium gradient background
    }}>
      <div className="card" style={{ 
        maxWidth: '380px', 
        width: '90%', 
        textAlign: 'center',
        padding: '2rem 1.5rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        borderRadius: '1rem',
        border: '1px solid rgba(255,255,255,0.8)',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <div className="logo" style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            <FileText size={28} color="var(--primary-color)" />
            Ajaia Docs
          </div>
        </div>
        <h2 style={{ marginBottom: '0.25rem', fontSize: '1.25rem', fontWeight: 700 }}>
          {isLogin ? 'Welcome Back' : 'Create an Account'}
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          {isLogin ? 'Sign in to access your workspace' : 'Join us and start collaborating today'}
        </p>
        
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {!isLogin && (
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                placeholder="Username"
                className="input"
                style={{ paddingLeft: '2.5rem', paddingRight: '1rem', paddingBottom: '0.625rem', paddingTop: '0.625rem', fontSize: '0.95rem' }}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required={!isLogin}
              />
            </div>
          )}

          <div style={{ position: 'relative' }}>
            <Mail size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="email" 
              placeholder="Email address"
              className="input"
              style={{ paddingLeft: '2.5rem', paddingRight: '1rem', paddingBottom: '0.625rem', paddingTop: '0.625rem', fontSize: '0.95rem' }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div style={{ position: 'relative' }}>
            <Lock size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="password" 
              placeholder="Password"
              className="input"
              style={{ paddingLeft: '2.5rem', paddingRight: '1rem', paddingBottom: '0.625rem', paddingTop: '0.625rem', fontSize: '0.95rem' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ 
              width: '100%', 
              padding: '0.75rem', 
              marginTop: '0.5rem', 
              fontSize: '0.95rem', 
              fontWeight: 600,
              boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.4)'
            }}
            disabled={loading}
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>

          {error && (
            <div style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', 
              color: 'var(--error-color)', 
              backgroundColor: '#fef2f2', 
              padding: '0.875rem', borderRadius: 'var(--radius-md)', fontSize: '0.875rem',
              border: '1px solid #fecaca',
              marginTop: '0.25rem'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span style={{ textAlign: 'left', lineHeight: '1.4' }}>{error}</span>
            </div>
          )}
        </form>

        <div style={{ marginTop: '1.25rem', fontSize: '0.875rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </span>
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(null); }}
            className="btn-ghost"
            style={{ padding: 0, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-color)' }}
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </div>

      </div>
    </div>
  );
};
