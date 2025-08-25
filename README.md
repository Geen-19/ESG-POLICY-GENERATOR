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
### 1. Backend
```
    cd server
    cp .env.example .env
    npm install
    npm run dev

```
- Serves on http://localhost:4000 (from index.js)
- Connects to MongoDB via MONGO_URI
- CORS origin should match your frontend dev URl(http://localhost:5173)

### 1. FrontEnd
```
    cd web
    cp .env.example .env
    npm install
    npm run dev

```
- Vite dev server on http://localhost:5173
- VITE_API_BASE must point at the backend URL
---

## 🗄️ Data Model
### A Policy contains a topic and an ordered array of Blocks.
 ```
type BlockType = 'heading' | 'paragraph' | 'list';

type Block = {
  id: string;                 // unique per block (e.g., nanoid)
  type: BlockType;
  order: number;              // explicit order for stable sorting
  title?: string;             // used for type='heading'
  content: string | string[]; // string for paragraph/heading, string[] for list
};

type Policy = {
  _id: string;
  topic: string;
  blocks: Block[];
  meta?: {
    generatedBy?: 'gemini' | 'user';
    createdAt?: string;
    updatedAt?: string;
  };
};

 ```

 ### Notes
- Maintain an explicit order on every block.
- For list blocks, store content as string[]. For paragraph/heading, use string.
- Normalize input to avoid runtime type errors in the editor.
---

## 🔌 API Reference
All JSON unless noted.
POST /api/policies/generate
Generate and persist a baseline policy for a topic.
```
{ "topic": "Water Conservation" }

```
201 Created
```
{
  "_id": "...",
  "topic": "Water Conservation",
  "blocks": [
    { "id": "b1", "type": "heading", "title": "Policy Statement", "content": "..." },
    { "id": "b2", "type": "paragraph", "content": "..." },
    { "id": "b3", "type": "list", "content": ["...","..."] }
  ],
  "meta": { "generatedBy": "gemini", "createdAt": "..." }
}

```
### Errors
- 400 invalid input (e.g., empty topic)

- 503 upstream AI unavailable

- 500 database error

### GET /api/policies/:id
Fetch a saved policy
```
{ "_id": "...", "topic": "...", "blocks": [...], "meta": {...} }

```

### PUT /api/policies/:id/blocks
Replace the block array for a policy.

```
{
  "blocks": [
    { "id": "b1", "type": "heading", "title": "New Title", "order": 1, "content": "..." }
  ]
}

```
200 OK

```
{ "ok": true }

```

## POST /api/policies/:id/export
Export the policy to pdf or docx.

```
{ "format": "pdf" }

```

### Response

- application/pdf binary, or

- { "url": "https://.../policy.pdf" } if returning a link

For consistent formatting, prefer server-side HTML→PDF (Puppeteer). docx export produced via the docx library.
---


## 🏗️ Build & Deploy (Minimal)

```
npm run dev 
```
- run in root folder and it starts both the server and the web!


---