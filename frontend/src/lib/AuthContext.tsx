import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, MOCK_USERS } from './db';

type AuthContextType = {
  user: User | null;
  login: (id: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem('mock_user_id');
    if (storedUserId) {
      const foundUser = MOCK_USERS.find(u => u.id === storedUserId);
      if (foundUser) setUser(foundUser);
    }
  }, []);

  const login = (id: string) => {
    const foundUser = MOCK_USERS.find(u => u.id === id);
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('mock_user_id', id);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('mock_user_id');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
