import { supabase } from './supabase';

export type Document = {
  document_uuid: string;
  title: string;
  content: string;
  owner_uuid: string;
  link_sharing_mode?: 'restricted' | 'anyone_with_link';
  link_sharing_role?: 'viewer' | 'editor';
  created_at: string;
  updated_at: string;
};

export type Share = {
  document_uuid: string;
  user_uuid: string;
  email?: string;
  role?: 'viewer' | 'editor';
};

// Local Storage Fallback implementation
const getLocalDocs = (): Document[] => JSON.parse(localStorage.getItem('docs') || '[]');
const saveLocalDocs = (docs: Document[]) => localStorage.setItem('docs', JSON.stringify(docs));
const getLocalShares = (): Share[] => JSON.parse(localStorage.getItem('shares') || '[]');
const saveLocalShares = (shares: Share[]) => localStorage.setItem('shares', JSON.stringify(shares));

export const db = {
  getDocuments: async (userId: string): Promise<{ owned: Document[], shared: Document[] }> => {
    if (supabase) {
      const { data: ownedData } = await supabase.from('documents').select('*').eq('owner_uuid', userId).order('updated_at', { ascending: false });
      const { data: sharesData } = await supabase.from('shares').select('document_uuid').eq('user_uuid', userId);
      
      const sharedDocIds = sharesData?.map(s => s.document_uuid || (s as any).document_id) || [];
      const { data: sharedData } = sharedDocIds.length > 0 
        ? await supabase.from('documents').select('*').in('document_uuid', sharedDocIds).order('updated_at', { ascending: false })
        : { data: [] };

      // Cache fallback map
      const mapDoc = (d: any) => ({ ...d, document_uuid: d.document_uuid || d.id });
      
      return { 
        owned: (ownedData || []).map(mapDoc), 
        shared: (sharedData || []).map(mapDoc)
      };
    } else {
      // Local fallback
      const allDocs = getLocalDocs();
      const allShares = getLocalShares();
      
      const owned = allDocs.filter(d => d.owner_uuid === userId).sort((a,b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      
      const sharedDocIds = allShares.filter(s => s.user_uuid === userId).map(s => s.document_uuid);
      const shared = allDocs.filter(d => sharedDocIds.includes(d.document_uuid)).sort((a,b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      
      return { owned, shared };
    }
  },
  
  getDocument: async (id: string): Promise<Document | null> => {
    if (supabase) {
      let { data, error } = await supabase.from('documents').select('*').eq('document_uuid', id).single();
      
      // Fallback for stale schema cache where column is still named 'id'
      if (error && error.message.includes('document_uuid')) {
        const fallback = await supabase.from('documents').select('*').eq('id', id).single();
        data = fallback.data;
        error = fallback.error;
      }
      
      if (error) throw error;
      if (data && !data.document_uuid && data.id) data.document_uuid = data.id;
      return data as Document;
    } else {
      return getLocalDocs().find(d => d.document_uuid === id) || null;
    }
  },
  
  createDocument: async (doc: Omit<Document, 'document_uuid' | 'created_at' | 'updated_at'>): Promise<Document> => {
    if (supabase) {
      // Supabase uses the default gen_random_uuid() for the document_uuid column
      const { data, error } = await supabase.from('documents').insert(doc).select().single();
      if (error) throw error;
      
      // PostgREST schema cache fallback: if it returns 'id' instead of 'document_uuid', map it.
      if (data && !data.document_uuid && data.id) {
        data.document_uuid = data.id;
      }
      return data as Document;
    } else {
      const newDoc: Document = {
        ...doc,
        document_uuid: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const docs = getLocalDocs();
      docs.push(newDoc);
      saveLocalDocs(docs);
      return newDoc;
    }
  },
  
  updateDocument: async (id: string, updates: Partial<Document>): Promise<Document> => {
    updates.updated_at = new Date().toISOString();
    
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/documents/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend update failed: ${errorText}`);
      }
      return await response.json();
    } else {
      const docs = getLocalDocs();
      const idx = docs.findIndex(d => d.document_uuid === id);
      if (idx === -1) throw new Error("Document not found");
      docs[idx] = { ...docs[idx], ...updates };
      saveLocalDocs(docs);
      return docs[idx];
    }
  },
  
  shareDocument: async (documentId: string, email: string, role: 'viewer' | 'editor' = 'viewer'): Promise<void> => {
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/documents/${documentId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ email, role })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Backend share failed: ${response.statusText}`);
      }
    } else {
      // Local fallback (dummy implementation)
      const shares = getLocalShares();
      const existing = shares.find(s => s.document_uuid === documentId && s.user_uuid === email);
      if (existing) {
        existing.role = role;
      } else {
        shares.push({ document_uuid: documentId, user_uuid: email, email, role });
      }
      saveLocalShares(shares);
    }
  },

  removeDocumentShare: async (documentId: string, userId: string): Promise<void> => {
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      
      const response = await fetch(`${backendUrl}/api/documents/${documentId}/share/${userId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to remove share');
      }
    }
  },

  getDocumentShares: async (documentId: string): Promise<Share[]> => {
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/documents/${documentId}/shares`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (response.ok) {
        return await response.json();
      }
      return [];
    } else {
      return getLocalShares().filter(s => s.document_uuid === documentId);
    }
  },

  deleteDocument: async (id: string): Promise<void> => {
    if (supabase) {
      let { error } = await supabase.from('documents').delete().eq('document_uuid', id);
      if (error && error.message.includes('document_uuid')) {
        const fallback = await supabase.from('documents').delete().eq('id', id);
        error = fallback.error;
      }
      if (error) throw error;
    } else {
      const docs = getLocalDocs().filter(d => d.document_uuid !== id);
      saveLocalDocs(docs);
    }
  }
};
