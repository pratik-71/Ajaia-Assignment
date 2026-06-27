import React from 'react';
import { FileText, LogOut, User } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

interface HeaderProps {
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ leftContent, rightContent }) => {
  const { user } = useAuth();

  const handleLogout = async () => {
    const { supabase } = await import('../lib/supabase');
    if (supabase) await supabase.auth.signOut();
  };

  if (!user) return null;

  return (
    <header className="header" style={{ borderBottom: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', gap: '1rem' }}>
      <div className="flex-row gap-4" style={{ flex: 1 }}>
        {leftContent || (
          <div className="logo">
            <FileText size={24} color="var(--primary-color)" />
            Ajaia Docs
          </div>
        )}
      </div>
      
      <div className="flex-row gap-4">
        {rightContent}
        
        <div className="flex-row gap-2" style={{ 
          padding: '0.375rem 0.75rem', 
          backgroundColor: 'var(--bg-color)', 
          borderRadius: '2rem',
          border: '1px solid var(--border-color)'
        }}>
          <User size={16} color="var(--text-secondary)" />
          <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
            {user.user_metadata?.username || user.email}
          </span>
        </div>
        <button className="btn btn-ghost" onClick={handleLogout} style={{ padding: '0.375rem 0.75rem', color: 'var(--error-color)' }}>
          <LogOut size={16} /> Logout
        </button>
      </div>
    </header>
  );
};
