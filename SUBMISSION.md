# Submission Contents

This folder contains all the materials required for the Ajaia Full Stack Product Engineer assessment.

## Included Files
- `frontend/` and `backend/` directories (Source code)
- `README.md` (Local setup and run instructions)
- `architecture.md` (Note on prioritization and technical tradeoffs)
- `ai-workflow.md` (Note on AI usage and verification)
- `video_link.txt` (Contains the URL to the walkthrough video)

## What is Working
- **Everything requested in the core requirements is fully functional.**
- Document creation, editing, saving, and renaming via the Tiptap rich-text editor.
- File upload integration (Turns `.txt` and `.md` files into rich-text documents instantly).
- Sharing documents with specific users by email address.
- Full database persistence and identity tracking via Supabase.

### Stretch Goals Achieved
- **Role-based Permissions:** When sharing a document, the owner can explicitly set the recipient as a "Viewer" or an "Editor", and the UI actively locks/unlocks the rich-text editing canvas based on that role.
- **Real-time Presence:** Connected to a Supabase Realtime WebSocket channel. If multiple users open the same document, their avatars instantly pop up in the header, letting everyone know the document is actively being viewed.

## What I would build next with 2-4 hours
If I had more time, I would swap out the debounced auto-save for a true real-time CRDT sync engine (like Yjs or Automerge). This would allow character-by-character collaborative typing just like Google Docs, where you can see the other user's cursor moving across the screen in real-time. I would also add the ability to organize documents into distinct workspace folders.
