import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../lib/AuthContext';
import { db, Document } from '../lib/db';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Upload, LogOut } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [ownedDocs, setOwnedDocs] = useState<Document[]>([]);
  const [sharedDocs, setSharedDocs] = useState<Document[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      loadDocs();
    }
  }, [user]);

  const loadDocs = async () => {
    if (!user) return;
    const { owned, shared } = await db.getDocuments(user.id);
    setOwnedDocs(owned);
    setSharedDocs(shared);
  };

  const handleCreateNew = async () => {
    if (!user) return;
    const doc = await db.createDocument({
      title: 'Untitled Document',
      content: '<p></p>',
      owner_id: user.id
    });
    navigate(`/doc/${doc.id}`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      // Convert basic text to HTML paragraphs for TipTap
      const htmlContent = content.split('\n').map(line => `<p>${line}</p>`).join('');
      
      const doc = await db.createDocument({
        title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
        content: htmlContent,
        owner_id: user.id
      });
      navigate(`/doc/${doc.id}`);
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!user) return null;

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo">
          <FileText size={24} color="var(--primary-color)" />
          Ajaia Docs
        </div>
        <div className="flex-row gap-4">
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Logged in as <strong>{user.name}</strong>
          </span>
          <button className="btn btn-ghost" onClick={logout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>
      
      <main className="main-content">
        <div className="flex-row justify-between mb-8">
          <h2>My Documents</h2>
          <div className="flex-row gap-2">
            <input 
              type="file" 
              accept=".txt,.md" 
              style={{ display: 'none' }} 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
              <Upload size={16} /> Upload File (.txt, .md)
            </button>
            <button className="btn btn-primary" onClick={handleCreateNew}>
              <Plus size={16} /> New Document
            </button>
          </div>
        </div>
        
        {ownedDocs.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--text-secondary)' }}>You don't have any documents yet.</p>
          </div>
        ) : (
          <div className="doc-grid mb-8">
            {ownedDocs.map(doc => (
              <div key={doc.id} className="doc-card" onClick={() => navigate(`/doc/${doc.id}`)}>
                <div className="doc-title">{doc.title}</div>
                <div className="doc-meta">Updated {new Date(doc.updated_at).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        )}
        
        {sharedDocs.length > 0 && (
          <>
            <h2 className="mb-4">Shared with Me</h2>
            <div className="doc-grid">
              {sharedDocs.map(doc => (
                <div key={doc.id} className="doc-card" onClick={() => navigate(`/doc/${doc.id}`)}>
                  <div className="doc-title">{doc.title}</div>
                  <div className="doc-meta">Updated {new Date(doc.updated_at).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};
