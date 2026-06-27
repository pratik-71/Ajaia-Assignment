import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { db, type Document } from '../lib/db';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { ArrowLeft, Save, Share2, Bold, Italic, Underline as UnderlineIcon, Heading1, Heading2, List, ListOrdered, CheckCircle2 } from 'lucide-react';
import { Header } from '../components/Header';
import { toast } from 'react-toastify';

export const EditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [doc, setDoc] = useState<Document | null>(null);
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUserId, setShareUserId] = useState('');

  // Debounced save function for auto-saving
  const debouncedSave = useCallback(
    (() => {
      let timer: ReturnType<typeof setTimeout>;
      return (newContent: string, currentTitle: string) => {
        clearTimeout(timer);
        timer = setTimeout(async () => {
          if (!id) return;
          setIsSaving(true);
          try {
            await db.updateDocument(id, { content: newContent, title: currentTitle });
            setLastSaved(new Date());
          } catch (e) {
            console.error("Auto-save failed", e);
          } finally {
            setIsSaving(false);
          }
        }, 1500); // 1.5 second debounce
      };
    })(),
    [id]
  );

  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: '',
    onUpdate: ({ editor }) => {
      if (doc) {
        debouncedSave(editor.getHTML(), title);
      }
    },
  });

  useEffect(() => {
    if (id && user) {
      loadDoc();
    }
  }, [id, user]);

  // When title changes, trigger autosave as well
  useEffect(() => {
    if (doc && title !== doc.title && editor) {
      debouncedSave(editor.getHTML(), title);
    }
  }, [title]);

  const loadDoc = async () => {
    if (!id) return;
    const loadedDoc = await db.getDocument(id);
    if (loadedDoc) {
      setDoc(loadedDoc);
      setTitle(loadedDoc.title);
      editor?.commands.setContent(loadedDoc.content);
      setLastSaved(new Date(loadedDoc.updated_at));
    }
  };

  const handleManualSave = async () => {
    if (!id || !doc || !editor) return;
    setIsSaving(true);
    try {
      await db.updateDocument(id, {
        title,
        content: editor.getHTML()
      });
      setLastSaved(new Date());
      toast.success('Document saved successfully');
    } catch (e) {
      console.error("Failed to save", e);
      toast.error('Failed to save document');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    if (!id || !shareUserId) return;
    try {
      await db.shareDocument(id, shareUserId);
      setShowShareModal(false);
      setShareUserId('');
      toast.success('Document shared successfully!');
    } catch (e) {
      toast.error('Failed to share document. Make sure the User ID is correct.');
    }
  };

  if (!user || !doc) return <div className="app-container" style={{ padding: '2rem' }}>Loading...</div>;

  const isOwner = doc.owner_id === user.id;

  const leftContent = (
    <div className="flex-row gap-4">
      <button className="btn btn-ghost btn-icon" onClick={() => navigate('/')}>
        <ArrowLeft size={20} />
      </button>
      
      <input 
        className="input" 
        style={{ width: '300px', fontWeight: 600, fontSize: '1.125rem', border: '1px solid transparent', background: 'transparent', padding: '0.25rem 0.5rem' }}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={!isOwner}
        placeholder="Document Title"
      />
    </div>
  );

  const rightContent = (
    <div className="flex-row gap-4">
      {lastSaved && (
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {isSaving ? (
            <>Saving...</>
          ) : (
            <><CheckCircle2 size={12} /> Saved {lastSaved.toLocaleTimeString()}</>
          )}
        </span>
      )}
      
      {isOwner && (
        <button className="btn btn-secondary" onClick={() => setShowShareModal(true)}>
          <Share2 size={16} /> Share
        </button>
      )}
      <button className="btn btn-primary" onClick={handleManualSave} disabled={isSaving}>
        <Save size={16} /> {isSaving ? 'Saving' : 'Save'}
      </button>
    </div>
  );

  return (
    <div className="app-container">
      <Header leftContent={leftContent} rightContent={rightContent} />
      
      <main className="main-content" style={{ maxWidth: '900px' }}>
        <div className="editor-container" style={{ minHeight: 'calc(100vh - 120px)', boxShadow: 'var(--shadow-md)' }}>
          <div className="editor-toolbar" style={{ position: 'sticky', top: '70px', zIndex: 5 }}>
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
          <EditorContent editor={editor} style={{ flex: 1, cursor: 'text' }} onClick={() => editor?.commands.focus()} />
        </div>
      </main>

      {showShareModal && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '1rem' }}>Share Document</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Select a user to grant access to this document.</p>
            
            <input 
              className="input mb-4" 
              placeholder="Enter User ID to share with"
              value={shareUserId} 
              onChange={e => setShareUserId(e.target.value)}
            />
            
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
