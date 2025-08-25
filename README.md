# ESG Policy Generator (MERN + Gemini)

AI-powered ESG policy generator with a block-based editor. Enter a topic, generate a structured baseline policy via Google Gemini, edit it as draggable **blocks** (Heading / Paragraph / List), and export to **PDF** or **DOCX**.

---

## ✨ Features

- **AI generation (Gemini):** Server-side prompt returns a normalized array of blocks for a given topic.
- **Block editor:** Inline edit, switch types, add/remove, and drag-and-drop reorder with a clean UX.
- **Persistence:** Save and fetch policies from MongoDB.
- **Export:** Copy to clipboard, export to **PDF** and **DOCX** (server-side).
- **Good DX:** Loading states, validation, and error toasts throughout.

---

## 🧱 Tech Stack

- **Frontend:** React + Vite, React Query, `@hello-pangea/dnd` for drag & drop  
- **Backend:** Node.js + Express  
- **Database:** MongoDB (Mongoose)  
- **AI:** Google Gemini (API key via server env only)  

---

## 🔑 Environment Variables
Create .env files using these templates. Do not commit real secrets.
- PORT=5000
- MONGO_URI=mongodb://localhost:27017/esg_policies
- GOOGLE_GEMINI_API_KEY=your_key_here
- GEMINI_MODEL=gemini-1.5-pro
- CLIENT_ORIGIN=http://localhost:5173

---

## 🚀 Quickstart (Local Dev)
```
    cd server
    cp .env.example .env
    npm install
    npm run dev

```