import React from 'react';
import { FileText, Trash2 } from 'lucide-react';
import { type Document } from '../lib/db';

interface DocumentCardProps {
  document: Document;
  onClick: (id: string) => void;
  onDelete?: (id: string, e: React.MouseEvent) => void;
  showDelete?: boolean;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ document, onClick, onDelete, showDelete }) => {
  return (
    <div className="doc-card" onClick={() => onClick(document.document_uuid)} style={{ position: 'relative' }}>
      <div className="flex-row gap-2 mb-2">
        <FileText size={18} color="var(--primary-color)" />
        <div className="doc-title" style={{ margin: 0, paddingRight: '24px' }}>{document.title}</div>
      </div>
      <div className="doc-meta">
        Updated {new Date(document.updated_at).toLocaleDateString()}
      </div>
      
      {showDelete && onDelete && (
        <button 
          className="btn-icon" 
          style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', color: 'var(--text-secondary)', padding: '0.25rem' }}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(document.document_uuid, e);
          }}
          title="Delete document"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
};
