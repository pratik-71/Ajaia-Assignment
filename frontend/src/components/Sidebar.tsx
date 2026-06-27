import React, { useRef } from 'react';
import { Plus, Upload, Folder, Users } from 'lucide-react';

export type TabType = 'my-docs' | 'shared';

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onCreateNew: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, onCreateNew, onFileUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <aside className="sidebar">
      <button 
        className="btn btn-primary" 
        onClick={onCreateNew}
        style={{ 
          width: '100%', 
          padding: '0.875rem', 
          borderRadius: '1rem',
          boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.4)',
          justifyContent: 'flex-start',
          gap: '0.75rem'
        }}
      >
        <Plus size={20} /> New Document
      </button>

      <input 
        type="file" 
        accept=".txt,.md" 
        style={{ display: 'none' }} 
        ref={fileInputRef}
        onChange={(e) => {
          onFileUpload(e);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }}
      />
      <button 
        className="btn btn-secondary" 
        onClick={() => fileInputRef.current?.click()}
        style={{ width: '100%', justifyContent: 'flex-start', gap: '0.75rem' }}
      >
        <Upload size={18} /> Upload File (.txt, .md)
      </button>

      <nav className="sidebar-nav">
        <div 
          className={`sidebar-item ${activeTab === 'my-docs' ? 'active' : ''}`}
          onClick={() => onTabChange('my-docs')}
        >
          <Folder size={18} /> My Documents
        </div>
        <div 
          className={`sidebar-item ${activeTab === 'shared' ? 'active' : ''}`}
          onClick={() => onTabChange('shared')}
        >
          <Users size={18} /> Shared with Me
        </div>
      </nav>
    </aside>
  );
};
