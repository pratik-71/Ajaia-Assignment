# Ajaia Collaborative Editor

A lightweight, real-time collaborative document editor built for the Ajaia Full Stack Product Engineer assessment.

## Features Built
- **Rich-text Editing:** Create, rename, and edit documents with headings, bold, italic, and lists using Tiptap. Auto-saves as you type.
- **File Uploads:** Instantly convert local `.txt` and `.md` files into rich-text documents.
- **Access Control:** Share documents with other users. Assign them either a "Viewer" or "Editor" role.
- **Real-time Presence (Stretch Goal):** Live avatars appear in the header instantly when another user opens the same document. 

## Tech Stack
- **Frontend:** React, TypeScript, Vite, Tiptap (Editor)
- **Backend:** Node.js, Express
- **Database & Auth:** Supabase (PostgreSQL, Realtime, Authentication)
- **Deployment:** Vercel (Monorepo architecture)

## Local Setup Instructions

**1. Install Dependencies**
Open a terminal and install the packages for both the frontend and backend:
```bash
cd backend
npm install

cd ../frontend
npm install
```

**2. Environment Variables**
Create a `.env` file in the `backend/` folder:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
PORT=5000
```

Create a `.env` file in the `frontend/` folder:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

**3. Run the App**
You need to start both servers. 

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

Open `http://localhost:5173` in your browser.

## Testing the Sharing Flow
You can create your own accounts using the sign-up page, or use two different browsers to test the real-time presence and sharing features.
