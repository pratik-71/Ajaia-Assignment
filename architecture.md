# Architecture & Prioritization Note

## Goal
The prompt requested a lightweight collaborative document editor built within a strict 4-6 hour timebox. Given the time constraints, my primary goal was to ship a highly polished, fully functional "slice" of a product rather than a buggy, overextended feature set. 

## What I Prioritized
1. **Core Editing UX:** I prioritized a seamless writing experience. I chose **Tiptap** for the editor because it is headless, heavily customizable, and handles the complexities of contenteditable seamlessly without forcing a specific UI on me.
2. **Access Control & Security:** I spent extra time building a secure Express backend and mapping Supabase UUIDs to documents. This ensures users can't arbitrarily edit documents they don't own or haven't been granted explicit access to.
3. **Collision Awareness (Stretch Goal):** Since multiple people could edit a document, I prioritized implementing Supabase Realtime Presence. By showing live avatars of who is currently in the document, users naturally avoid editing the exact same paragraph simultaneously.

## Tradeoffs & What I Deprioritized
**Full CRDT Real-time Editing:** I intentionally chose *not* to build character-by-character real-time cursors (e.g., using Yjs or Automerge). Building a reliable Operational Transformation / CRDT sync engine with conflict resolution would easily consume the entire 6 hours alone. 

Instead, I implemented a robust **debounced auto-save** architecture. When a user stops typing for 1000ms, their changes are pushed to the database. If another user is in the document (visible via the Presence avatars), they can refresh to pull the latest state. This tradeoff allowed me to meet every single core requirement while still having time to build out file uploads, the UI system, and role-based sharing permissions.

## Database Schema
The Supabase PostgreSQL database is structured simply:
- `users`: Handled natively by Supabase Auth.
- `documents`: Stores `title`, `content` (HTML), `owner_uuid`, and timestamps.
- `document_shares`: A junction table mapping `document_uuid` to `user_uuid` with an access `role` (viewer or editor).
