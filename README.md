# Assy

Assy is an AI-powered Gmail assistant that makes email feel less like work. It connects directly to your Gmail account, summarizes conversations as they arrive, organizes your inbox, lets you search using plain English, and writes contextual replies in your preferred tone.

It started as a Gmail client with AI summaries. It's now closer to an intelligent inbox that understands what matters, helps you respond faster, and keeps your email workflow in one place.

## what's in here

```
public/         — frontend (HTML, CSS, Vanilla JavaScript)
server.js       — Express server, Gmail API, OAuth, Gemini integration
package.json    — dependencies and scripts
.env            — local configuration (generated after setup)
```

One frontend. One backend. Gmail handles email, Gemini handles reasoning.

---

## running it

### install

```bash
npm install
```

### start the server

```bash
npm start
```

for development

```bash
npm run dev
```

Open:

```
http://localhost:3000
```

On first launch you'll be asked for:

- Gemini API Key
- Google Client ID
- Google Client Secret

Save the configuration, connect your Gmail account through OAuth, and Assy is ready to use.

---

## what it actually does

**summarizes your inbox.** Every email is automatically condensed into a short summary so you can understand the message without opening it.

**understands your emails.** Assy classifies messages into categories like Primary, Promotions, Updates, Social, and Forums using Gemini, with results cached locally to reduce API usage.

**searches like a person.** Instead of remembering Gmail search operators, type something like *"emails from John about internships last month"* and Assy translates it into a valid Gmail search query.

**writes replies for you.** Generate contextual responses in Professional, Friendly, Direct, Apologetic, or any custom tone. Edit the draft before sending.

**sends emails safely.** AI-generated drafts stay editable. Nothing is sent until you review and confirm.

**renders HTML securely.** Emails are displayed inside a sandboxed iframe so external styles and scripts can't interfere with the application.

**stays connected to Gmail.** Uses Google's official OAuth flow and Gmail API, so everything stays synced with your account.

---

## the interface

**sidebar** — inbox navigation and Gmail folders

**email list** — conversations with AI summaries and categories

**reader** — full email rendered securely

**search bar** — natural language search powered by Gemini

**compose panel** — AI-generated drafts with selectable writing tones

---

## under the hood

The frontend is written entirely with HTML, CSS, and Vanilla JavaScript—no frontend frameworks. It communicates with an Express backend through REST APIs.

The backend manages Google OAuth authentication, Gmail API requests, AI processing with Google Gemini, email categorization, semantic search generation, and reply drafting. Configuration is stored locally in a `.env` file after the initial setup.

---

## tech stack

- HTML5
- CSS3
- Vanilla JavaScript
- Node.js
- Express.js
- Gmail API
- Google OAuth 2.0
- Google Gemini 2.5 Flash

---

## the look

Dark-first interface inspired by modern email clients. Glassmorphism panels, smooth transitions, concise AI summaries, and a clean reading experience focused on reducing inbox overload rather than adding more clutter.
