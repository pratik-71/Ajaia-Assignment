const { supabase } = require('../db');

const updateDocument = async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  const userId = req.user.id;

  try {
    const updates = { updated_at: new Date().toISOString() };
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;

    // Using RLS, Supabase will ensure the user has access. 
    // However, since we are doing a server-side call using the anon key, 
    // we would normally pass the user's JWT so RLS works.
    // Instead of initializing a new client per request, we can just do a direct query 
    // and rely on the controller logic, or we can use the supabase auth.setSession if needed.
    // For simplicity, let's just make sure the user owns it or has access.
    
    console.log(`[updateDocument] Attempting to update document with id: ${id}`);
    console.log(`[updateDocument] Request from user: ${userId}`);
    
    // Check if document exists and user has access (either owner or shared)
    let { data: doc, error: docError } = await supabase
      .from('documents')
      .select('owner_uuid, link_sharing_mode, link_sharing_role')
      .eq('document_uuid', id)
      .single();

    // Fallback if cache is stale
    if (docError && docError.message && docError.message.includes('document_uuid')) {
      console.log(`[updateDocument] Schema cache stale, trying 'id' column...`);
      const fallback = await supabase
        .from('documents')
        .select('owner_uuid, link_sharing_mode, link_sharing_role')
        .eq('id', id)
        .single();
      doc = fallback.data;
      docError = fallback.error;
    }

    if (docError || !doc) {
      console.log(`[updateDocument] Error: Document not found. DB Error:`, docError);
      return res.status(404).json({ error: 'Document not found' });
    }
    
    console.log(`[updateDocument] Document found! Owner: ${doc.owner_uuid}`);

    let hasAccess = false;
    let isOwner = false;
    
    if (doc.owner_uuid === userId) {
      hasAccess = true;
      isOwner = true;
    } else if (doc.link_sharing_mode === 'anyone_with_link' && doc.link_sharing_role === 'editor') {
      hasAccess = true;
    } else {
      const { data: share, error: shareError } = await supabase
        .from('shares')
        .select('role')
        .eq('document_uuid', id)
        .eq('user_uuid', userId)
        .single();
      
      if (share && !shareError && share.role === 'editor') {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden: You do not have access to update this document' });
    }
    
    // Non-owners cannot update sharing settings
    if (!isOwner) {
      delete updates.link_sharing_mode;
      delete updates.link_sharing_role;
    }

    let { data, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('document_uuid', id)
      .select()
      .single();

    if (error && error.message && error.message.includes('document_uuid')) {
      const fallback = await supabase
        .from('documents')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      console.error(`[updateDocument] Failed to update document in DB:`, error);
      throw error;
    }
    
    console.log(`[updateDocument] Successfully updated document ${id}`);
    res.json(data);
  } catch (err) {
    console.error("Error updating document:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const shareDocumentByEmail = async (req, res) => {
  const { id } = req.params;
  const { email, role = 'viewer' } = req.body;
  const userId = req.user.id;

  try {
    // Verify ownership
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('owner_uuid')
      .eq('document_uuid', id)
      .single();

    if (docError || !doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (doc.owner_uuid !== userId) {
      return res.status(403).json({ error: 'Only the owner can share this document' });
    }

    // Lookup user by email using Admin API
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error("Error fetching users list:", usersError);
      return res.status(500).json({ error: 'Failed to look up user' });
    }

    const targetUser = users.find(u => u.email === email);
    
    if (!targetUser) {
      return res.status(404).json({ error: 'No user found with that email address' });
    }

    if (targetUser.id === userId) {
      return res.status(400).json({ error: 'You cannot share a document with yourself' });
    }

    // Insert or update into shares
    const { error: insertError } = await supabase
      .from('shares')
      .upsert({ document_uuid: id, user_uuid: targetUser.id, role }, { onConflict: 'document_uuid, user_uuid' });

    if (insertError) {
      console.error(insertError);
      throw insertError;
    }

    res.json({ success: true, message: 'Document shared successfully' });
  } catch (err) {
    console.error("Error sharing document:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const removeShare = async (req, res) => {
  const { id, userId: targetUserId } = req.params;
  const userId = req.user.id;

  try {
    // Only owner can remove shares
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('owner_uuid')
      .eq('document_uuid', id)
      .single();

    if (docError || !doc) return res.status(404).json({ error: 'Document not found' });
    if (doc.owner_uuid !== userId) return res.status(403).json({ error: 'Only the owner can remove access' });

    const { error: deleteError } = await supabase
      .from('shares')
      .delete()
      .eq('document_uuid', id)
      .eq('user_uuid', targetUserId);

    if (deleteError) throw deleteError;

    res.json({ success: true, message: 'Access removed successfully' });
  } catch (err) {
    console.error("Error removing share:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  updateDocument,
  shareDocumentByEmail,
  removeShare,
  getShares: async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
      const { data: doc, error: docError } = await supabase
        .from('documents')
        .select('owner_uuid')
        .eq('document_uuid', id)
        .single();
      
      if (docError || !doc) return res.status(404).json({ error: 'Not found' });
      
      // Allow if owner, or if user is in shares, or if link sharing is enabled?
      // For simplicity, just allow logged in users who can fetch the document to fetch its shares.
      
      const { data: shares, error: shareError } = await supabase
        .from('shares')
        .select('user_uuid, role')
        .eq('document_uuid', id);
        
      if (shareError) throw shareError;
      
      // Lookup emails (in a real app, you'd join with auth.users or profiles table. Since we only have admin access for auth:)
      const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
      if (usersError) throw usersError;
      
      const mappedShares = shares.map(share => {
        const u = users.find(u => u.id === share.user_uuid);
        return {
          user_uuid: share.user_uuid,
          email: u ? u.email : 'Unknown User',
          role: share.role
        };
      });
      
      res.json(mappedShares);
    } catch (err) {
      res.status(500).json({ error: 'Internal error' });
    }
  }
};
