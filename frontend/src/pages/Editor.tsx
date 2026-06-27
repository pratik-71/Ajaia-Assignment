import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { db, type Document, type Share } from '../lib/db';
import { supabase } from '../lib/supabase';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { ArrowLeft, Save, Share2, Bold, Italic, Underline as UnderlineIcon, Heading1, Heading2, List, ListOrdered, CheckCircle2, PenLine, Lock, Globe, Trash2, X, Download, MessageSquare } from 'lucide-react';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { Header } from '../components/Header';
import { toast } from 'react-toastify';
import Mention from '@tiptap/extension-mention';
import { CommentMark, getSuggestion } from '../components/EditorExtensions';

import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/light.css';
import 'tippy.js/animations/shift-away.css';

export const EditorPage: React.FC = () => {
  const { id: routeId } = useParams<{ id: string }>();
  const id = routeId?.replace(/^doc_/, '');
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [doc, setDoc] = useState<Document | null>(null);
  const [shares, setShares] = useState<Share[]>([]);
  const [title, setTitle] = useState('');
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [isManualSaving, setIsManualSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareRole, setShareRole] = useState<'viewer' | 'editor'>('viewer');
  const [userToRemove, setUserToRemove] = useState<{uuid: string, email: string} | null>(null);
  const [activeUsers, setActiveUsers] = useState<{ id: string, email: string }[]>([]);
  const [hoveredUserId, setHoveredUserId] = useState<string | null>(null);
  const [dismissedWarning, setDismissedWarning] = useState(false);
  
  // Pending state for General Access (saved on Done)
  const [pendingLinkMode, setPendingLinkMode] = useState<'restricted' | 'anyone_with_link' | null>(null);
  const [pendingLinkRole, setPendingLinkRole] = useState<'viewer' | 'editor' | null>(null);

  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentInput, setCommentInput] = useState('');

  // Initialize pending state when modal opens
  useEffect(() => {
    if (showShareModal && doc) {
      setPendingLinkMode(doc.link_sharing_mode as 'restricted' | 'anyone_with_link' || 'restricted');
      setPendingLinkRole(doc.link_sharing_role as 'viewer' | 'editor' || 'viewer');
    }
  }, [showShareModal, doc]);


  // Permissions logic
  const isOwner = doc?.owner_uuid === user?.id;
  const myShare = shares.find(s => s.user_uuid === user?.id);
  const canEdit = isOwner || 
                  (doc?.link_sharing_mode === 'anyone_with_link' && doc?.link_sharing_role === 'editor') || 
                  (myShare?.role === 'editor');

  // Debounced save function for auto-saving
  const debouncedSave = useCallback(
    (() => {
      let timer: ReturnType<typeof setTimeout>;
      return (newContent: string, currentTitle: string) => {
        clearTimeout(timer);
        timer = setTimeout(async () => {
          if (!id) return;
          setIsAutoSaving(true);
          try {
            await db.updateDocument(id, { content: newContent, title: currentTitle });
            setLastSaved(new Date());
          } catch (e) {
            console.error("Auto-save failed", e);
          } finally {
            setIsAutoSaving(false);
          }
        }, 1500); // 1.5 second debounce
      };
    })(),
    [id]
  );

  const mentionableUsers = React.useMemo(() => {
    const emails = [user?.email, ...shares.map(s => s.email)].filter(Boolean) as string[];
    return Array.from(new Set(emails));
  }, [user, shares]);

  const mentionableUsersRef = useRef<string[]>([]);
  useEffect(() => {
    mentionableUsersRef.current = mentionableUsers;
  }, [mentionableUsers]);

  const editor = useEditor({
    extensions: [
      StarterKit, 
      Underline,
      CommentMark,
      Mention.configure({
        HTMLAttributes: { class: 'mention', style: 'color: var(--primary-color); font-weight: bold; background: var(--bg-secondary); padding: 2px 4px; border-radius: 4px;' },
        suggestion: getSuggestion(() => mentionableUsersRef.current),
      })
    ],
    content: '',
    editorProps: {
      handleClick: (_view, _pos, event) => {
        const target = event.target as HTMLElement;
        if (target && target.classList.contains('comment-highlight')) {
          const commentId = target.getAttribute('data-tippy-content');
          if (commentId !== null) {
            setCommentInput(commentId);
            setShowCommentModal(true);
            // Optionally could set text selection to the clicked position
            return true;
          }
        }
        return false;
      }
    },
    onUpdate: ({ editor }) => {
      if (doc && canEdit) {
        debouncedSave(editor.getHTML(), title);
      }
    },
  }, []);

  useEffect(() => {
    if (editor) {
      editor.setEditable(canEdit);
    }
  }, [editor, canEdit]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isAutoSaving || isManualSaving) {
        e.preventDefault();
        e.returnValue = ''; // Required for browser warning prompt
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isAutoSaving, isManualSaving]);

  useEffect(() => {
    if (id && user) {
      loadDoc();
    }
  }, [id, user]);

  const loadDoc = async () => {
    if (!id) return;
    try {
      const loadedDoc = await db.getDocument(id);
      if (loadedDoc) {
        setDoc(loadedDoc);
        setTitle(loadedDoc.title);
        setLastSaved(new Date(loadedDoc.updated_at));
        
        const loadedShares = await db.getDocumentShares(id);
        setShares(loadedShares);
      }
    } catch (e: any) {
      console.error("LOAD DOC ERROR:", e);
      toast.error("You don't have access to this document");
      navigate('/');
    }
  };

  // Sync loaded document content into the editor
  useEffect(() => {
    if (editor && doc && editor.getHTML() !== doc.content) {
      try {
        editor.commands.setContent(doc.content);
      } catch (e) {
        console.error("Editor sync error:", e);
      }
    }
  }, [editor, doc]);

  // Real-time presence using Supabase
  useEffect(() => {
    if (!id || !user || !supabase) return;
    
    const channel = supabase.channel(`room:${id}`, {
      config: { presence: { key: user.id } }
    });
    
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users: { id: string, email: string }[] = [];
        
        for (const key in state) {
          state[key].forEach((presence: any) => {
             // We only want to show OTHER users in the header, not ourselves
             if (presence.id && presence.id !== user.id) {
               // Prevent duplicates
               if (!users.find(u => u.id === presence.id)) {
                 users.push({ id: presence.id, email: presence.email });
               }
             }
          });
        }
        setActiveUsers(users);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ id: user.id, email: user.email });
        }
      });

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [id, user]);

  const handleManualSave = async () => {
    if (!id || !doc || !editor || !canEdit) return;
    setIsManualSaving(true);
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
      setIsManualSaving(false);
    }
  };

  const handleShare = async () => {
    if (!id || !shareEmail) return;
    try {
      await db.shareDocument(id, shareEmail, shareRole);
      setShareEmail('');
      toast.success('Document shared successfully!');
      // Reload shares
      const loadedShares = await db.getDocumentShares(id);
      setShares(loadedShares);
    } catch (e: any) {
      toast.error(e.message || 'Failed to share document. Please try again.');
    }
  };

  const handleRemoveShare = async () => {
    if (!id || !isOwner || !userToRemove) return;
    try {
      await db.removeDocumentShare(id, userToRemove.uuid);
      toast.success('Access removed');
      setUserToRemove(null);
      const loadedShares = await db.getDocumentShares(id);
      setShares(loadedShares);
    } catch (e: any) {
      toast.error(e.message || 'Failed to remove access');
    }
  };

  const handleUpdateUserRole = async (email: string, newRole: 'viewer' | 'editor') => {
    if (!id || !isOwner) return;
    try {
      await db.shareDocument(id, email, newRole);
      toast.success('Role updated');
      const loadedShares = await db.getDocumentShares(id);
      setShares(loadedShares);
    } catch (e: any) {
      toast.error(e.message || 'Failed to update role');
    }
  };

  const handleUpdateLinkSharing = async (mode: 'restricted' | 'anyone_with_link', role: 'viewer' | 'editor') => {
    if (!id || !doc || !isOwner) return;
    try {
      const updated = await db.updateDocument(id, { link_sharing_mode: mode, link_sharing_role: role });
      setDoc(updated);
      toast.success('Link sharing updated');
    } catch (e) {
      toast.error('Failed to update link sharing');
    }
  };

  const handleDoneClick = async () => {
    // If pending general access state differs from doc state, save it
    if (isOwner && doc && (pendingLinkMode !== doc.link_sharing_mode || pendingLinkRole !== doc.link_sharing_role)) {
      await handleUpdateLinkSharing(pendingLinkMode!, pendingLinkRole!);
    }
    setShowShareModal(false);
  };

  const handleExportPDF = () => {
    if (!editor) return;
    const content = editor.getHTML();
    
    // Create a temporary element to hold the content with some basic styling
    const element = document.createElement('div');
    element.innerHTML = `
      <div style="padding: 40px; font-family: sans-serif; line-height: 1.6; color: #333;">
        <h1 style="margin-bottom: 20px; font-size: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">${title || 'Untitled Document'}</h1>
        ${content}
      </div>
    `;

    const opt = {
      margin:       10,
      filename:     `${title || 'Document'}.pdf`,
      image:        { type: 'jpeg' as const, quality: 1 },
      html2canvas:  { scale: 4, useCORS: true, letterRendering: true },
      jsPDF:        { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };

    toast.success('Generating High-Quality PDF...');
    html2pdf().set(opt).from(element).save();
  };

  if (!user || !doc) return <div className="app-container" style={{ padding: '2rem' }}>Loading...</div>;

  const leftContent = (
    <div className="flex-row gap-4">
      <button className="btn btn-ghost btn-icon" onClick={() => navigate('/')}>
        <ArrowLeft size={20} />
      </button>
      
      <div className="title-input-wrapper">
        <input 
          className="title-input" 
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (editor && canEdit) debouncedSave(editor.getHTML(), e.target.value);
          }}
          disabled={!canEdit}
          placeholder="Document Title"
          style={{ maxWidth: '350px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
          title={title}
        />
        {canEdit && <PenLine size={16} className="title-edit-icon" />}
        {!canEdit && <span style={{ marginLeft: '12px', fontSize: '0.8rem', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '12px', color: 'var(--text-secondary)' }}>View Only</span>}
      </div>
    </div>
  );

  const rightContent = (
    <div className="flex-row gap-4">
      {lastSaved && canEdit && (
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {isAutoSaving ? (
            <>Auto-saving...</>
          ) : (
            <><CheckCircle2 size={12} /> Saved {lastSaved.toLocaleTimeString()}</>
          )}
        </span>
      )}
      
      {activeUsers.length > 0 && (
        <div className="flex-row align-center" style={{ marginLeft: '1rem', marginRight: '0.5rem' }}>
          {activeUsers.slice(0, 3).map((activeUser, i) => (
            <div
              key={activeUser.id}
              style={{ position: 'relative', zIndex: 10 - i, marginLeft: i > 0 ? '-10px' : '0' }}
              onMouseEnter={() => setHoveredUserId(activeUser.id)}
              onMouseLeave={() => setHoveredUserId(null)}
            >
              <div 
                style={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: '50%', 
                  background: `hsl(${(activeUser.email.charCodeAt(0) * 20) % 360}, 70%, 50%)`, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: 'white', 
                  fontWeight: 'bold', 
                  fontSize: '0.9rem',
                  border: '2px solid white',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                  cursor: 'pointer'
                }}
              >
                {activeUser.email[0].toUpperCase()}
              </div>
              
              {/* Custom Instant Tooltip */}
              {hoveredUserId === activeUser.id && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  marginTop: '8px',
                  background: 'var(--text-primary)',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  zIndex: 100,
                  pointerEvents: 'none'
                }}>
                  {activeUser.email}
                </div>
              )}
            </div>
          ))}
          {activeUsers.length > 3 && (
            <div style={{
              width: 32, 
              height: 32, 
              borderRadius: '50%', 
              background: 'var(--bg-secondary)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: 'var(--text-secondary)',
              fontSize: '0.8rem',
              fontWeight: 600,
              border: '2px solid white',
              marginLeft: '-10px',
              zIndex: 1
            }}>
              +{activeUsers.length - 3}
            </div>
          )}
        </div>
      )}

      {isOwner && (
        <button className="btn btn-secondary" onClick={() => setShowShareModal(true)}>
          <Share2 size={16} /> Share
        </button>
      )}
      <button className="btn btn-secondary" onClick={handleExportPDF}>
        <Download size={16} /> Export PDF
      </button>
      {canEdit && (
        <button className="btn btn-primary" onClick={handleManualSave} disabled={isManualSaving}>
          <Save size={16} /> {isManualSaving ? 'Saving' : 'Save'}
        </button>
      )}
    </div>
  );

  return (
    <div className="app-container">
      <Header leftContent={leftContent} rightContent={rightContent} />
      
      <main className="main-content" style={{ maxWidth: '900px' }}>
        <div className="editor-container" style={{ minHeight: 'calc(100vh - 120px)', boxShadow: 'var(--shadow-md)' }}>
          {canEdit && (
            <div 
              className="editor-toolbar" 
              style={{ borderBottom: '1px solid var(--border-color)', zIndex: 5 }}
              onMouseDown={(e) => e.preventDefault()}
            >
              <button onClick={() => editor?.chain().focus().toggleBold().run()} className={`btn btn-icon ${editor?.isActive('bold') ? 'active' : ''}`}><Bold size={18} /></button>
              <button onClick={() => editor?.chain().focus().toggleItalic().run()} className={`btn btn-icon ${editor?.isActive('italic') ? 'active' : ''}`}><Italic size={18} /></button>
              <button onClick={() => editor?.chain().focus().toggleUnderline().run()} className={`btn btn-icon ${editor?.isActive('underline') ? 'active' : ''}`}><UnderlineIcon size={18} /></button>
              <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 4px' }} />
              <button onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} className={`btn btn-icon ${editor?.isActive('heading', { level: 1 }) ? 'active' : ''}`}><Heading1 size={18} /></button>
              <button onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} className={`btn btn-icon ${editor?.isActive('heading', { level: 2 }) ? 'active' : ''}`}><Heading2 size={18} /></button>
              <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 4px' }} />
              <button onClick={() => editor?.chain().focus().toggleBulletList().run()} className={`btn btn-icon ${editor?.isActive('bulletList') ? 'active' : ''}`}><List size={18} /></button>
              <button onClick={() => editor?.chain().focus().toggleOrderedList().run()} className={`btn btn-icon ${editor?.isActive('orderedList') ? 'active' : ''}`}><ListOrdered size={18} /></button>
              <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 4px' }} />
              <button onClick={() => {
                setCommentInput('');
                setShowCommentModal(true);
              }} className={`btn btn-icon ${editor?.isActive('comment') ? 'active' : ''}`} title="Add Comment">
                <MessageSquare size={18} />
              </button>
            </div>
          )}
          <EditorContent editor={editor} style={{ flex: 1, padding: canEdit ? '0' : '2rem' }} />
        </div>
      </main>

      {showShareModal && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="modal-content" style={{ width: '600px', maxWidth: '95vw' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '1.5rem', fontWeight: 600, fontSize: '1.25rem' }}>Share "{doc.title}"</h3>
            
            {/* Top: Email Share */}
            <div className="flex-row gap-2 mb-4">
              <input 
                type="email"
                className="input" 
                style={{ flex: 1 }}
                placeholder="Add people via email"
                value={shareEmail} 
                onChange={e => setShareEmail(e.target.value)}
              />
              <select className="input" style={{ width: 'auto' }} value={shareRole} onChange={e => setShareRole(e.target.value as 'viewer'|'editor')}>
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
              </select>
              <button className="btn btn-primary" onClick={handleShare} disabled={!shareEmail}>Share</button>
            </div>

            {/* Middle: People with access */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', fontWeight: 600 }}>People with access</h4>
              <div className="flex-row justify-between align-center" style={{ marginBottom: '1rem' }}>
                <div className="flex-row gap-4 align-center">
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.1rem', flexShrink: 0 }}>
                    {user?.email?.[0].toUpperCase()}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontWeight: 500, lineHeight: 1.2, marginBottom: '2px' }}>{user?.email} (you)</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.2 }}>Owner</div>
                  </div>
                </div>
              </div>
              
              {shares.map(share => (
                <div key={share.user_uuid} className="flex-row justify-between align-center" style={{ marginBottom: '1rem' }}>
                  <div className="flex-row gap-4 align-center">
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '1.1rem', flexShrink: 0 }}>
                      {share.email?.[0].toUpperCase()}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <div style={{ fontWeight: 500, lineHeight: 1.2 }}>{share.email}</div>
                    </div>
                  </div>
                  <div className="flex-row gap-4 align-center">
                    {isOwner ? (
                      <select 
                        className="input" 
                        style={{ 
                          width: 'auto', 
                          background: 'transparent', 
                          border: 'none', 
                          fontWeight: 500,
                          padding: '0.2rem 0.5rem',
                          cursor: 'pointer',
                          color: 'var(--text-secondary)'
                        }} 
                        value={share.role} 
                        onChange={(e) => handleUpdateUserRole(share.email || '', e.target.value as 'viewer'|'editor')}
                      >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                      </select>
                    ) : (
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        {share.role === 'editor' ? 'Editor' : 'Viewer'}
                      </div>
                    )}
                    {isOwner && (
                      <button 
                        className="btn btn-ghost" 
                        style={{ padding: '0.25rem', color: 'var(--error-color)' }}
                        onClick={() => setUserToRemove({ uuid: share.user_uuid, email: share.email || 'this user' })}
                        title="Remove access"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Bottom: General Access (Link Sharing) */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', fontWeight: 600 }}>General access</h4>
              <div className="flex-row justify-between align-start">
                <div className="flex-row gap-4 align-start">
                  <div style={{ width: 40, height: 40, background: 'var(--bg-secondary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {doc.link_sharing_mode === 'anyone_with_link' ? <Globe size={20} color="var(--primary-color)" /> : <Lock size={20} color="var(--text-secondary)" />}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="flex-row gap-4 align-center" style={{ marginBottom: '0.4rem' }}>
                      <select 
                        className="input" 
                        style={{ 
                          border: '1px solid var(--border-color)', 
                          padding: '0.4rem 0.75rem', 
                          fontWeight: 600, 
                          fontSize: '0.95rem', 
                          background: 'var(--bg-secondary)', 
                          cursor: 'pointer',
                          borderRadius: '8px',
                          outline: 'none',
                          transition: 'border-color 0.2s',
                          width: '200px'
                        }}
                        value={pendingLinkMode || 'restricted'}
                        onChange={(e) => setPendingLinkMode(e.target.value as any)}
                        disabled={!isOwner}
                      >
                        <option value="restricted">Restricted</option>
                        <option value="anyone_with_link">Anyone with the link</option>
                      </select>

                      {pendingLinkMode === 'anyone_with_link' && (
                        <select 
                          className="input" 
                          style={{ 
                            width: 'auto', 
                            background: 'transparent', 
                            border: '1px solid var(--border-color)', 
                            fontWeight: 500,
                            padding: '0.4rem 0.75rem',
                            borderRadius: '8px',
                            cursor: 'pointer'
                          }} 
                          value={pendingLinkRole || 'viewer'} 
                          onChange={(e) => setPendingLinkRole(e.target.value as any)}
                          disabled={!isOwner}
                        >
                          <option value="viewer">Viewer</option>
                          <option value="editor">Editor</option>
                        </select>
                      )}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {pendingLinkMode === 'anyone_with_link' ? 'Anyone on the internet with the link can view' : 'Only people with access can open'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-row justify-between" style={{ marginTop: '2rem' }}>
              <button className="btn btn-secondary" style={{ borderRadius: '20px', padding: '0.5rem 1rem' }} onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success('Link copied to clipboard!');
              }}>
                <Share2 size={16} /> Copy Link
              </button>
              <button className="btn btn-primary" style={{ borderRadius: '20px', padding: '0.5rem 1.5rem' }} onClick={handleDoneClick}>Done</button>
            </div>
          </div>
        </div>
      )}

      {userToRemove && (
        <div className="modal-overlay" onClick={() => setUserToRemove(null)} style={{ zIndex: 1000 }}>
          <div className="modal-content" style={{ width: '400px', maxWidth: '90vw', textAlign: 'center', padding: '2rem' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <Trash2 size={24} />
            </div>
            <h3 style={{ marginBottom: '1rem', fontWeight: 600, fontSize: '1.25rem' }}>Remove Access?</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.5 }}>
              Are you sure you want to remove access for <strong style={{ color: 'var(--text-primary)' }}>{userToRemove.email}</strong>? They will no longer be able to open this document.
            </p>
            <div className="flex-row gap-3 justify-center">
              <button className="btn btn-secondary" onClick={() => setUserToRemove(null)} style={{ flex: 1 }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleRemoveShare} style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none' }}>Remove</button>
            </div>
          </div>
        </div>
      )}

      {activeUsers.length > 0 && !dismissedWarning && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          backgroundColor: '#fff3cd',
          color: '#856404',
          padding: '12px 16px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 1000,
          border: '1px solid #ffeeba',
          maxWidth: '350px'
        }}>
          <span style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>
            <strong>Warning:</strong> One or more people are working on this document. This can cause conflicts since changes are not synced in real-time.
          </span>
          <button 
            onClick={() => setDismissedWarning(true)}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              cursor: 'pointer', 
              color: '#856404', 
              padding: '4px',
              display: 'flex',
              alignItems: 'flex-start',
              height: '100%'
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {showCommentModal && (
        <div className="modal-overlay" onClick={() => setShowCommentModal(false)} style={{ zIndex: 1000 }}>
          <div className="modal-content" style={{ width: '400px', maxWidth: '90vw' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontWeight: 600, fontSize: '1.25rem', margin: 0 }}>Add a Comment</h3>
              <button className="btn btn-icon btn-ghost" onClick={() => setShowCommentModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <textarea 
              className="input" 
              style={{ width: '100%', minHeight: '100px', resize: 'vertical', marginBottom: '1.5rem' }}
              placeholder="Enter your comment (it will be saved inline)..."
              value={commentInput}
              onChange={e => setCommentInput(e.target.value)}
              autoFocus
            />
            
            <div className="flex-row gap-3 justify-end">
              <button className="btn btn-secondary" onClick={() => setShowCommentModal(false)}>Cancel</button>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  if (commentInput.trim() && editor) {
                    editor.chain().focus().setComment(commentInput.trim()).setTextSelection(editor.state.selection.to).run();
                  }
                  setShowCommentModal(false);
                }}
                disabled={!commentInput.trim()}
              >
                Add Comment
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

