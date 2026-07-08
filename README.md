# Mailly

Mailly is an AI-powered Gmail assistant that makes email feel less like work. It connects directly to your Gmail account, summarizes conversations as they arrive, organizes your inbox, lets you search using plain English, and writes contextual replies in your preferred tone.

It started as a Gmail client with AI summaries. It's now closer to an intelligent inbox that understands what matters, helps you respond faster, and keeps your email workflow in one place.

## What's in here

```text
public/         — frontend (HTML, CSS, Vanilla JavaScript)
server.js       — Express server, Gmail API, OAuth, Gemini integration
package.json    — dependencies and scripts
.env            — local configuration (generated after setup)
```

One frontend. One backend. Gmail handles email, Gemini handles reasoning.

---

## Running it

### Install

```bash
npm install
```

### Start the server

```bash
npm start
```

For development:

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

Save the configuration, connect your Gmail account through OAuth, and Mailly is ready to use.

---

## Features

### AI Inbox Summaries

Every email is automatically condensed into a concise summary so you can understand the message without opening it.

### Smart Email Classification

Mailly categorizes emails into Primary, Promotions, Updates, Social, and Forums using Google Gemini, with local caching to reduce API usage.

### Natural Language Search

Search your inbox using plain English.

Examples:

- "emails from John about internships"
- "Amazon orders from last month"
- "unread emails from my professor"

Mailly translates your request into a valid Gmail search query automatically.

### AI Reply Generation

Generate contextual email drafts in multiple writing styles:

- Professional
- Friendly
- Direct
- Apologetic
- Custom tone

Every draft is editable before sending.

### Safe Email Sending

AI never sends emails automatically.

You always review and approve drafts before they are sent.

### Secure Email Rendering

Emails are displayed inside a sandboxed iframe for improved security and isolation.

### Gmail Integration

Uses Google's official OAuth 2.0 flow and Gmail API, keeping everything synchronized with your Gmail account.

---

## Interface

- **Sidebar** — Gmail folders and navigation
- **Email List** — conversations with AI summaries
- **Reader** — secure HTML email viewer
- **Search Bar** — natural language search
- **Compose Panel** — AI-powered reply generation

---

## Architecture

The frontend is built entirely using HTML, CSS, and Vanilla JavaScript without any frontend frameworks.

The Express backend manages:

- Google OAuth authentication
- Gmail API communication
- Gemini API integration
- AI categorization
- Natural language search
- AI reply generation

Configuration is stored locally in a `.env` file after the initial setup.

---

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Node.js
- Express.js
- Gmail API
- Google OAuth 2.0
- Google Gemini 2.5 Flash

---

## Design

Mailly features a dark-first interface inspired by modern email clients, combining glassmorphism panels, smooth transitions, AI-generated summaries, and a distraction-free reading experience focused on reducing inbox overload.
