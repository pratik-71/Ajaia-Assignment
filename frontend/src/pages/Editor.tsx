import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { db, Document, MOCK_USERS } from '../lib/db';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { ArrowLeft, Save, Share2, Bold, Italic, Underline as UnderlineIcon, Heading1, Heading2, List, ListOrdered } from 'lucide-react';

export const EditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [doc, setDoc] = useState<Document | null>(null);
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUserId, setShareUserId] = useState('');

  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: '',
    onUpdate: ({ editor }) => {
      // Autosave could be implemented here, but we'll use a manual save button for simplicity as requested by "Save and reopen documents"
    },
  });

  useEffect(() => {
    if (id && user) {
      loadDoc();
    }
  }, [id, user]);

  const loadDoc = async () => {
    if (!id) return;
    const loadedDoc = await db.getDocument(id);
    if (loadedDoc) {
      setDoc(loadedDoc);
      setTitle(loadedDoc.title);
      editor?.commands.setContent(loadedDoc.content);
    }
  };

  const handleSave = async () => {
    if (!id || !doc || !editor) return;
    setIsSaving(true);
    try {
      await db.updateDocument(id, {
        title,
        content: editor.getHTML()
      });
      // Update local state to show saved
      setTimeout(() => setIsSaving(false), 500);
    } catch (e) {
      console.error("Failed to save", e);
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    if (!id || !shareUserId) return;
    await db.shareDocument(id, shareUserId);
    setShowShareModal(false);
    setShareUserId('');
    alert('Document shared successfully!');
  };

  if (!user || !doc) return <div className="app-container" style={{ padding: '2rem' }}>Loading...</div>;

  const isOwner = doc.owner_id === user.id;

  return (
    <div className="app-container">
      <header className="header" style={{ gap: '1rem' }}>
        <button className="btn btn-ghost btn-icon" onClick={() => navigate('/')}>
          <ArrowLeft size={20} />
        </button>
        
        <input 
          className="input" 
          style={{ flex: 1, maxWidth: '400px', fontWeight: 600, fontSize: '1.125rem', border: 'none', background: 'transparent' }}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={!isOwner}
          placeholder="Document Title"
        />
        
        <div className="flex-row gap-2">
          {isOwner && (
            <button className="btn btn-secondary" onClick={() => setShowShareModal(true)}>
              <Share2 size={16} /> Share
            </button>
          )}
          <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
            <Save size={16} /> {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </header>
      
      <main className="main-content" style={{ maxWidth: '800px' }}>
        <div className="editor-container">
          <div className="editor-toolbar">
            <button onClick={() => editor?.chain().focus().toggleBold().run()} className={`btn btn-icon ${editor?.isActive('bold') ? 'active' : ''}`}><Bold size={18} /></button>
            <button onClick={() => editor?.chain().focus().toggleItalic().run()} className={`btn btn-icon ${editor?.isActive('italic') ? 'active' : ''}`}><Italic size={18} /></button>
            <button onClick={() => editor?.chain().focus().toggleUnderline().run()} className={`btn btn-icon ${editor?.isActive('underline') ? 'active' : ''}`}><UnderlineIcon size={18} /></button>
            <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 4px' }} />
            <button onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} className={`btn btn-icon ${editor?.isActive('heading', { level: 1 }) ? 'active' : ''}`}><Heading1 size={18} /></button>
            <button onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} className={`btn btn-icon ${editor?.isActive('heading', { level: 2 }) ? 'active' : ''}`}><Heading2 size={18} /></button>
            <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 4px' }} />
            <button onClick={() => editor?.chain().focus().toggleBulletList().run()} className={`btn btn-icon ${editor?.isActive('bulletList') ? 'active' : ''}`}><List size={18} /></button>
            <button onClick={() => editor?.chain().focus().toggleOrderedList().run()} className={`btn btn-icon ${editor?.isActive('orderedList') ? 'active' : ''}`}><ListOrdered size={18} /></button>
          </div>
          <EditorContent editor={editor} />
        </div>
      </main>

      {showShareModal && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '1rem' }}>Share Document</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Select a user to grant access to this document.</p>
            
            <select 
              className="input mb-4" 
              value={shareUserId} 
              onChange={e => setShareUserId(e.target.value)}
            >
              <option value="">Select User...</option>
              {MOCK_USERS.filter(u => u.id !== user.id).map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            
            <div className="flex-row gap-2" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowShareModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleShare} disabled={!shareUserId}>Share</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
