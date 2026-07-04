# ✨ Assy - Gmail Intelligent Assistant

Assy is a premium, AI-powered Gmail client built with HTML, Vanilla CSS, and JavaScript, backed by a Node.js Express server. It integrates the **Gmail API** with **Google Gemini 2.5 Flash** to provide high-quality summarizations, automatic categorizations, contextual draft generation, and semantic email search.

---

## 🚀 Features

- **📬 Real-time Sync**: Direct integration with your Gmail account using the official Google OAuth 2.0 flow.
- **✨ AI-Generated Summaries**: Generates 1-2 sentence summaries for every email loaded, capturing the core intent instantly.
- **🏷️ Intelligent Categorization**: Classifies emails into categories (*Primary*, *Updates*, *Promotions*, *Social*, *Forums*) with reasoning, cached locally to optimize token usage.
- **🔍 Natural Language Search**: Translate standard human requests (e.g., *"urgent budget emails from last week"*) into valid Gmail search syntax queries via Gemini.
- **✍️ Tone-Aware AI Draft Replies**: Compose polite, contextual replies tailored to 4 different tones (*Professional*, *Friendly*, *Direct*, *Apologetic*) or custom user-supplied constraints.
- **📤 Safe Direct Sending**: Review, edit, and send drafts directly from the interface safely inside standard nested thread lines.
- **🔒 Secure Sandbox Rendering**: Renders HTML emails inside a sandboxed `<iframe>` to prevent CSS bleed-through and scripting vulnerabilities.

---

## 🛠️ Step-by-Step Installation

### 1. Install Dependencies
Make sure you have Node.js and npm installed. Run:
```bash
npm install
```

### 2. Set Up Google Cloud Console & Gmail API
To link the Gmail API, you need Google OAuth 2.0 Client credentials:
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g., `Assy-Mail-AI`).
3. Search for **Gmail API** in the API library and click **Enable**.
4. Go to the **OAuth consent screen** tab:
   - Choose User Type **External** (or Internal if you use a Google Workspace domain).
   - Fill in the developer contact details.
   - Under **Scopes**, click **Add or Remove Scopes** and add:
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/gmail.compose`
     - `https://www.googleapis.com/auth/gmail.send`
     - `https://www.googleapis.com/auth/gmail.modify`
   - Under **Test Users**, add your personal Gmail address (this is crucial for testing before production publishing).
5. Go to the **Credentials** tab:
   - Click **Create Credentials** -> **OAuth client ID**.
   - Choose Application type: **Web application**.
   - Name: `Assy Mail AI Client`.
   - Add **Authorized redirect URIs**: `http://localhost:3000/api/auth/callback`.
   - Click **Create** and copy your **Client ID** and **Client Secret**.

### 3. Get Gemini API Key
1. Go to the [Google AI Studio](https://aistudio.google.com/).
2. Click **Create API Key**.
3. Copy the generated key.

---

## 🚦 How to Run the App

1. Start the Express server:
   ```bash
   npm start
   ```
   *For development with auto-restarts on save:*
   ```bash
   npm run dev
   ```
2. Open your web browser and navigate to:
   ```
   http://localhost:3000
   ```
3. If this is your first run, you will see a **System Configuration** screen. Input your:
   - **Gemini API Key**
   - **Google Client ID**
   - **Google Client Secret**
   - Click **Save Configuration** (this automatically writes values into the `.env` file).
4. Click **Connect Gmail Account** to authenticate. Allow permissions in the Google OAuth consent flow.
5. You will be redirected back to the **Assy** dashboard, loaded with your emails!

---

## 🎨 File Architecture

- [package.json](file:///C:/Users/Varsshini/dev/ai-gmail-assistant/package.json) - Node dependencies & build script.
- [server.js](file:///C:/Users/Varsshini/dev/ai-gmail-assistant/server.js) - Express backend API, OAuth callback server, Google Auth library, & Google Gen AI SDK connections.
- [public/index.html](file:///C:/Users/Varsshini/dev/ai-gmail-assistant/public/index.html) - Application layout structure.
- [public/styles.css](file:///C:/Users/Varsshini/dev/ai-gmail-assistant/public/styles.css) - Styling sheet with dark mode color tokens, glassmorphism design, and loading screens.
- [public/app.js](file:///C:/Users/Varsshini/dev/ai-gmail-assistant/public/app.js) - Application controller linking the user interface to APIs.
- [.env](file:///C:/Users/Varsshini/dev/ai-gmail-assistant/.env) - Local system credentials storage.
