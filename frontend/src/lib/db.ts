import { supabase } from './supabase';

export type Document = {
  id: string;
  title: string;
  content: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
};

export type Share = {
  document_id: string;
  user_id: string;
};

// Local Storage Fallback implementation
const getLocalDocs = (): Document[] => JSON.parse(localStorage.getItem('docs') || '[]');
const saveLocalDocs = (docs: Document[]) => localStorage.setItem('docs', JSON.stringify(docs));
const getLocalShares = (): Share[] => JSON.parse(localStorage.getItem('shares') || '[]');
const saveLocalShares = (shares: Share[]) => localStorage.setItem('shares', JSON.stringify(shares));

export const db = {
  getDocuments: async (userId: string): Promise<{ owned: Document[], shared: Document[] }> => {
    if (supabase) {
      // Supabase implementation
      const { data: owned } = await supabase.from('documents').select('*').eq('owner_id', userId).order('updated_at', { ascending: false });
      
      const { data: shares } = await supabase.from('shares').select('document_id').eq('user_id', userId);
      const sharedDocIds = shares?.map(s => s.document_id) || [];
      
      let shared: Document[] = [];
      if (sharedDocIds.length > 0) {
        const { data } = await supabase.from('documents').select('*').in('id', sharedDocIds).order('updated_at', { ascending: false });
        shared = data || [];
      }
      
      return { owned: owned || [], shared };
    } else {
      // Local fallback
      const allDocs = getLocalDocs();
      const allShares = getLocalShares();
      
      const owned = allDocs.filter(d => d.owner_id === userId).sort((a,b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      
      const sharedDocIds = allShares.filter(s => s.user_id === userId).map(s => s.document_id);
      const shared = allDocs.filter(d => sharedDocIds.includes(d.id)).sort((a,b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      
      return { owned, shared };
    }
  },
  
  getDocument: async (id: string): Promise<Document | null> => {
    if (supabase) {
      const { data } = await supabase.from('documents').select('*').eq('id', id).single();
      return data;
    } else {
      return getLocalDocs().find(d => d.id === id) || null;
    }
  },
  
  createDocument: async (doc: Omit<Document, 'id' | 'created_at' | 'updated_at'>): Promise<Document> => {
    if (supabase) {
      const { data, error } = await supabase.from('documents').insert(doc).select().single();
      if (error) throw error;
      return data;
    } else {
      const newDoc: Document = {
        ...doc,
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
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
      
      const response = await fetch(`http://localhost:5000/api/documents/${id}`, {
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
      const idx = docs.findIndex(d => d.id === id);
      if (idx === -1) throw new Error("Document not found");
      docs[idx] = { ...docs[idx], ...updates };
      saveLocalDocs(docs);
      return docs[idx];
    }
  },
  
  shareDocument: async (document_id: string, user_id: string): Promise<void> => {
    if (supabase) {
      await supabase.from('shares').upsert({ document_id, user_id });
    } else {
      const shares = getLocalShares();
      if (!shares.find(s => s.document_id === document_id && s.user_id === user_id)) {
        shares.push({ document_id, user_id });
        saveLocalShares(shares);
      }
    }
  }
};
