import React from 'react';
import { FileText } from 'lucide-react';
import { type Document } from '../lib/db';

interface DocumentCardProps {
  document: Document;
  onClick: (id: string) => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ document, onClick }) => {
  return (
    <div className="doc-card" onClick={() => onClick(document.id)}>
      <div className="flex-row gap-2 mb-2">
        <FileText size={18} color="var(--primary-color)" />
        <div className="doc-title" style={{ margin: 0 }}>{document.title}</div>
      </div>
      <div className="doc-meta">Updated {new Date(document.updated_at).toLocaleDateString()}</div>
    </div>
  );
};
