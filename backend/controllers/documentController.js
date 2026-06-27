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
    
    // Check if document exists and user has access (either owner or shared)
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('owner_id')
      .eq('id', id)
      .single();

    if (docError || !doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    let hasAccess = false;
    if (doc.owner_id === userId) {
      hasAccess = true;
    } else {
      const { data: share, error: shareError } = await supabase
        .from('shares')
        .select('document_id')
        .eq('document_id', id)
        .eq('user_id', userId)
        .single();
      
      if (share && !shareError) {
        hasAccess = true;
      }
    }

    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden: You do not have access to update this document' });
    }

    const { data, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    res.json(data);
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
};

module.exports = { updateDocument };
