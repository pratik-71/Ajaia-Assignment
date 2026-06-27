import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { db, type Document } from '../lib/db';
import { useNavigate } from 'react-router-dom';
import { Folder, Users } from 'lucide-react';
import { Header } from '../components/Header';
import { Sidebar, type TabType } from '../components/Sidebar';
import { DocumentCard } from '../components/DocumentCard';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [ownedDocs, setOwnedDocs] = useState<Document[]>([]);
  const [sharedDocs, setSharedDocs] = useState<Document[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('my-docs');
  const [docToDelete, setDocToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      loadDocs();
    }
  }, [user]);

  const loadDocs = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { owned, shared } = await db.getDocuments(user.id);
      setOwnedDocs(owned);
      setSharedDocs(shared);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = async () => {
    if (!user) return;
    try {
      const doc = await db.createDocument({
        title: 'Untitled Document',
        content: '<p></p>',
        owner_uuid: user.id
      });
      console.log("CREATED DOC RESPONSE:", doc);
      navigate(`/doc/doc_${doc.document_uuid}`);
    } catch (e: any) {
      console.error("Failed to create document:", e);
      alert("Error creating document: " + (e.message || JSON.stringify(e)));
    }
  };

  const confirmDelete = async () => {
    if (!docToDelete) return;
    setIsDeleting(true);
    try {
      await db.deleteDocument(docToDelete);
      await loadDocs(); // reload docs
      setDocToDelete(null);
    } catch (e: any) {
      console.error("Failed to delete document:", e);
      alert("Error deleting document: " + (e.message || JSON.stringify(e)));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const htmlContent = content.split('\n').map(line => `<p>${line}</p>`).join('');
      
      const doc = await db.createDocument({
        title: file.name.replace(/\.[^/.]+$/, ""),
        content: htmlContent,
        owner_uuid: user.id
      });
      navigate(`/doc/doc_${doc.document_uuid}`);
    };
    reader.readAsText(file);
  };

  if (!user) return null;

  return (
    <div className="app-container">
      <Header />
      
      <div className="dashboard-layout">
        <Sidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          onCreateNew={handleCreateNew} 
          onFileUpload={handleFileUpload} 
        />

        <main className="dashboard-main">
          <div className="flex-row justify-between mb-8">
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>
              {activeTab === 'my-docs' ? 'My Documents' : 'Shared with Me'}
            </h2>
          </div>
          
          {activeTab === 'my-docs' && (
            isLoading ? (
              <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
                <p>Loading documents...</p>
              </div>
            ) : ownedDocs.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', borderStyle: 'dashed' }}>
                <Folder size={48} color="var(--border-color)" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ marginBottom: '0.5rem' }}>No documents yet</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Create a new document or upload a file to get started.</p>
                <button className="btn btn-primary" onClick={handleCreateNew}>
                  Create Document
                </button>
              </div>
            ) : (
              <div className="doc-grid">
                {ownedDocs.map(doc => (
                  <DocumentCard 
                    key={doc.document_uuid} 
                    document={doc} 
                    onClick={(id) => navigate(`/doc/doc_${id}`)}
                    onDelete={(id) => setDocToDelete(id)}
                    showDelete={true}
                  />
                ))}
              </div>
            )
          )}

          {activeTab === 'shared' && (
            isLoading ? (
              <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
                <p>Loading shared documents...</p>
              </div>
            ) : sharedDocs.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', borderStyle: 'dashed' }}>
                <Users size={48} color="var(--border-color)" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ marginBottom: '0.5rem' }}>No shared documents</h3>
                <p style={{ color: 'var(--text-secondary)' }}>Documents shared with you will appear here.</p>
              </div>
            ) : (
              <div className="doc-grid">
                {sharedDocs.map(doc => (
                  <DocumentCard 
                    key={doc.document_uuid} 
                    document={doc} 
                    onClick={(id) => navigate(`/doc/doc_${id}`)} 
                  />
                ))}
              </div>
            )
          )}
        </main>
      </div>

      {docToDelete && (
        <div className="modal-overlay" onClick={() => !isDeleting && setDocToDelete(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '1rem' }}>Delete Document</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Are you sure you want to delete this document? This action cannot be undone.</p>
            <div className="flex-row gap-2" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setDocToDelete(null)} disabled={isDeleting}>Cancel</button>
              <button 
                className="btn btn-primary" 
                style={{ background: 'var(--error-color)', color: 'white', opacity: isDeleting ? 0.7 : 1 }} 
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
