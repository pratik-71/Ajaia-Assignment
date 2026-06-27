# Ajaia Collaborative Editor

A lightweight, real-time collaborative document editor built for the Ajaia Full Stack Product Engineer assessment.

**🎥 [View the 5-Minute Video Walkthrough Here](https://www.loom.com/share/794d8f176f4948b98e10d98356777374)**

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

**2. Environment Variables & Test Users**
For the reviewers: I have placed the `.env` credentials and a list of pre-configured Test Users in a secure Google Drive folder for your convenience.

📁 **[Access the Environment Credentials and Test Users Here](https://drive.google.com/drive/folders/1rlzRoMyyMI8NAQhBSIpPF8l39dPEcbVtH?usp=sharing)**

Please use the values from `env_creds.txt` to populate your `.env` files, and refer to `Test Users.txt` for the credentials of the pre-made accounts to quickly test the collaboration features.

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
