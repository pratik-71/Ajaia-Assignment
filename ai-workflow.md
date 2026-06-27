# AI-Native Workflow Note

## Tools Used
- Google Antigravity Agentic IDE (Antigravity) 
- Chatgpt ( for phase by phase planning)
- Vercel (for deployment )

## Where AI Materially Sped Up My Work
The AI fundamentally changed how I approached the 4-6 hour timebox. Because the AI handled the heavy lifting of boilerplate generation, I was able to spend my mental energy strictly on product architecture and UX decision-making. 
- **Component Scaffolding:** I used the AI to rapidly generate the React UI components (Sidebar, Dashboard, Editor) using standard Tailwind-like utility classes.
- **Data Parsing:** When implementing the `.txt` and `.md` file upload feature, the AI instantly generated the `FileReader` logic to parse the raw text and structure it into HTML paragraphs (`<p>`) for the Tiptap editor.
- **Bug Squashing:** When Vercel failed to deploy due to strict TypeScript compilation errors (`tsc -b`), the AI immediately pinpointed the null-safety issues with the Supabase client and patched them across the codebase in seconds.

## What AI-Generated Output I Changed or Rejected
The AI is a powerful co-pilot, but it still requires human judgment to guide it:
- **UI Spacing:** The AI initially designed the document header with no gaps between the "Role" dropdown and the "Delete" icon. I had to manually step in, reject the design, and instruct it to use `gap-4` to ensure the interface felt breathable and premium.
- **Deployment Architecture:** The AI initially struggled with Vercel's beta `experimentalServices` monorepo routing. It tried to overcomplicate the Express routing to handle URL stripping. I intervened to ensure we used a clean `routePrefix` configuration and a simple relative `API_BASE_URL` in the frontend, preventing massive technical debt.

## How I Verified Correctness and Quality
I treated the AI exactly like a junior engineer on my team: trust, but verify. 
1. **Side-by-Side Testing:** I verified the real-time presence avatars and the access-control logic by running two separate browser instances (one normal, one Incognito), logging into two different accounts, and sharing a document back and forth.
2. **Console Monitoring:** I closely monitored the network tab and the Express logs to ensure the debounced auto-save wasn't spamming the database with unnecessary `PUT` requests while typing. 
