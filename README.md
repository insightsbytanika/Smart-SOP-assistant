# Smart SOP Assistant

> *Because writing SOPs manually is a waste of everyone's time.*

I built this after noticing how much time teams waste documenting the same processes over and over — copy-pasting from old docs, formatting manually, trying to remember every step. This tool fixes that. You describe a task, and it generates a clean, structured SOP in seconds. Then you can edit it, save it, and build up an entire internal knowledge base.

It's simple. It's fast. And it actually works.

---

## What it does

Type any task — *"how to handle a customer refund"*, *"onboarding checklist for new hires"*, *"monthly inventory audit process"* — and get back a fully structured SOP with purpose, scope, and step-by-step instructions. Save it to your dashboard, refine it later, share it with your team.

No more blank pages. No more "just ask Raj, he knows how it's done."

---

## Demo

```
Input:  "How to respond to a negative product review online"

Output: ## SOP: Responding to Negative Product Reviews
        
        ### Purpose
        To ensure all negative reviews are handled professionally,
        consistently, and in a way that protects brand reputation.
        
        ### Steps
        1. Acknowledge the review within 24 hours
        2. Apologize sincerely without admitting fault
        3. Move the conversation offline...
```

---

## Built with

- **Node.js + Express** — backend server and API routing
- **Vanilla JavaScript** — no frameworks, just clean JS
- **Tailwind CSS** — utility-first styling
- **Gemini AI** — the brain behind SOP generation
- **Vite** — lightning fast dev server

No unnecessary dependencies. No bloat. Just what the project needs.

---

## Run it yourself

You'll need Node.js installed. That's it.

```bash
# Clone and install
git clone https://github.com/insightsbytanika/smart-sop-assistant.git
cd smart-sop-assistant
npm install
```

```bash
# Add your API key
echo "GEMINI_API_KEY=your_key_here" > .env
```
Get a free key at [openrouter.ai](https://openrouter.ai) — no credit card needed.

```bash
# Start the app
npm run dev
```

Open `http://localhost:3000` and you're good to go.

---

## How it works under the hood

The architecture is intentionally simple:

```
Browser → POST /api/generate → Express → Gemini AI → response → Browser
                                    ↕
                              sops.json (local storage)
```

The AI call happens **on the server**, not the browser. This means the API key never touches the client — it stays in `.env` on your machine. The frontend just sends a task string and gets back formatted text. Clean separation, no leaks.

SOPs are stored in a local `sops.json` file. No database setup, no configuration — just a JSON array that persists between sessions.

The editing flow uses a `PUT /api/sops/:id` endpoint — when you load a saved SOP back into the editor and hit save, it overwrites the existing entry by ID instead of creating a duplicate. Small detail, but it matters for a tool people actually use daily.

---

## API surface

```
POST   /api/generate      →  generate SOP from task description
GET    /api/sops          →  fetch all saved SOPs
POST   /api/sops          →  save a new SOP
PUT    /api/sops/:id      →  update existing SOP by ID
DELETE /api/sops/:id      →  delete SOP by ID
```

---

## Project structure

```
smart-sop-assistant/
├── server.js         ← all backend logic lives here
├── sops.json         ← your SOP database (auto-created)
├── .env              ← API key goes here, never commit this
└── src/
    ├── app.js        ← frontend: fetch calls, DOM updates, edit flow
    ├── style.css     ← custom styles on top of Tailwind
    └── index.css     ← Tailwind entry point
```

---

## What I'd add next

- Export SOPs as PDF or Word docs
- Search and filter across saved SOPs
- Role-based access (who can edit vs view)
- Version history for edited SOPs

---

*Made by [Tanika Gupta](https://linkedin.com/in/tanika-gupta-632113338) — feel free to use it, break it, or improve it.*