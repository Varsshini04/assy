import express from 'express';
import { google } from 'googleapis';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cors from 'cors';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Path to store user tokens
const TOKEN_PATH = path.join(__dirname, 'token.json');
// Path to store AI analysis cache
const CACHE_PATH = path.join(__dirname, 'analysis-cache.json');
// Path to dynamic env file for user settings
const ENV_PATH = path.join(__dirname, '.env');

// Helper to read JSON files safely
function readJsonFile(filePath, defaultVal = {}) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (err) {
    console.error(`Error reading file ${filePath}:`, err);
  }
  return defaultVal;
}

// Helper to write JSON files safely
function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`Error writing file ${filePath}:`, err);
    return false;
  }
}

// Get Google OAuth Client config from environment variables
function getOAuthConfig() {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI || `http://localhost:${PORT}/api/auth/callback`
  };
}

// Initialize OAuth2 client
function getOAuth2Client() {
  const { clientId, clientSecret, redirectUri } = getOAuthConfig();
  if (!clientId || !clientSecret) {
    return null;
  }
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

// Check configuration status
app.get('/api/config-status', (req, res) => {
  const { clientId, clientSecret } = getOAuthConfig();
  const geminiKey = process.env.GEMINI_API_KEY;
  res.json({
    configured: !!(clientId && clientSecret && geminiKey),
    missing: {
      GOOGLE_CLIENT_ID: !clientId,
      GOOGLE_CLIENT_SECRET: !clientSecret,
      GEMINI_API_KEY: !geminiKey
    }
  });
});

// Save configuration from setup screen
app.post('/api/save-config', (req, res) => {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GEMINI_API_KEY, GOOGLE_REDIRECT_URI } = req.body;
  
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GEMINI_API_KEY) {
    return res.status(400).json({ error: 'Missing required configuration keys' });
  }

  const envContent = [
    `GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}`,
    `GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}`,
    `GEMINI_API_KEY=${GEMINI_API_KEY}`,
    `GOOGLE_REDIRECT_URI=${GOOGLE_REDIRECT_URI || `http://localhost:${PORT}/api/auth/callback`}`,
    `PORT=${PORT}`
  ].join('\n');

  try {
    fs.writeFileSync(ENV_PATH, envContent, 'utf8');
    
    // Explicitly update process.env for current runtime to bypass dotenv cache limits
    process.env.GOOGLE_CLIENT_ID = GOOGLE_CLIENT_ID;
    process.env.GOOGLE_CLIENT_SECRET = GOOGLE_CLIENT_SECRET;
    process.env.GEMINI_API_KEY = GEMINI_API_KEY;
    if (GOOGLE_REDIRECT_URI) {
      process.env.GOOGLE_REDIRECT_URI = GOOGLE_REDIRECT_URI;
    }
    
    // Reload env variables with override enabled
    dotenv.config({ override: true });
    res.json({ success: true, message: 'Configuration saved. Restarting environment.' });
  } catch (err) {
    console.error('Failed to write .env file:', err);
    res.status(500).json({ error: 'Failed to write configuration' });
  }
});

// OAuth Auth Status
app.get('/api/auth/status', (req, res) => {
  const oauth2Client = getOAuth2Client();
  if (!oauth2Client) {
    return res.json({ authenticated: false, reason: 'oauth_not_configured' });
  }

  if (fs.existsSync(TOKEN_PATH)) {
    const tokens = readJsonFile(TOKEN_PATH);
    if (tokens && tokens.access_token) {
      return res.json({ authenticated: true });
    }
  }
  res.json({ authenticated: false });
});

// OAuth URL Generator
app.get('/api/auth/url', (req, res) => {
  const oauth2Client = getOAuth2Client();
  if (!oauth2Client) {
    return res.status(400).json({ error: 'OAuth client not configured. Please complete setup.' });
  }

  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify'
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent' // Forces consent screen to ensure refresh token is returned
  });

  res.json({ url });
});

// OAuth Callback handler
app.get('/api/auth/callback', async (req, res) => {
  const { code } = req.query;
  const oauth2Client = getOAuth2Client();
  if (!oauth2Client) {
    return res.status(500).send('OAuth Client not configured.');
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    // Read existing tokens if any to preserve refresh token
    let storedTokens = {};
    if (fs.existsSync(TOKEN_PATH)) {
      storedTokens = readJsonFile(TOKEN_PATH);
    }
    
    const mergedTokens = {
      ...storedTokens,
      ...tokens
    };
    
    writeJsonFile(TOKEN_PATH, mergedTokens);
    
    // Redirect user back to the application home dashboard
    res.send(`
      <html>
        <body style="font-family: Arial, sans-serif; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; background-color: #f3f7fa; color: #1e293b;">
          <h2 style="color: #4f46e5; margin-bottom: 8px;">Gmail Connection Successful!</h2>
          <p style="color: #475569; margin: 0;">You can close this window now or return to the app.</p>
          <script>
            setTimeout(() => {
              window.location.href = '/';
            }, 1500);
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    res.status(500).send(`Authentication failed: ${error.message}`);
  }
});

// OAuth Logout handler
app.post('/api/auth/logout', (req, res) => {
  try {
    if (fs.existsSync(TOKEN_PATH)) {
      fs.unlinkSync(TOKEN_PATH);
    }
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Failed to log out.' });
  }
});

// Helper to get authenticated Gmail client
async function getGmailClient() {
  const oauth2Client = getOAuth2Client();
  if (!oauth2Client) {
    throw new Error('OAuth Client not configured');
  }

  if (!fs.existsSync(TOKEN_PATH)) {
    throw new Error('Not authenticated');
  }

  const tokens = readJsonFile(TOKEN_PATH);
  oauth2Client.setCredentials(tokens);

  // Handle Token Refreshing
  oauth2Client.on('tokens', (newTokens) => {
    const updatedTokens = {
      ...readJsonFile(TOKEN_PATH),
      ...newTokens
    };
    writeJsonFile(TOKEN_PATH, updatedTokens);
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

// Helper to strip HTML tags
function stripHtml(html) {
  if (!html) return '';
  let text = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<[^>]+>/g, ' ');
  text = text.replace(/\s+/g, ' ');
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&quot;/g, '"');
  return text.trim();
}

// Helper to extract email body from payload
function getEmailBody(payload) {
  if (!payload) return '';
  if (payload.body && payload.body.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf-8');
  }
  if (payload.parts) {
    return findTextInParts(payload.parts);
  }
  return '';
}

function findTextInParts(parts) {
  // Try to find html first as it is more complete, then plain text
  const htmlPart = findMimeType(parts, 'text/html');
  if (htmlPart && htmlPart.body && htmlPart.body.data) {
    return Buffer.from(htmlPart.body.data, 'base64').toString('utf-8');
  }
  const textPart = findMimeType(parts, 'text/plain');
  if (textPart && textPart.body && textPart.body.data) {
    return Buffer.from(textPart.body.data, 'base64').toString('utf-8');
  }
  return '';
}

function findMimeType(parts, mimeType) {
  for (const part of parts) {
    if (part.mimeType === mimeType) {
      return part;
    }
    if (part.parts) {
      const found = findMimeType(part.parts, mimeType);
      if (found) return found;
    }
  }
  return null;
}

// Extract specific header value
function getHeader(headers, name) {
  const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
  return header ? header.value : '';
}

// Get list of emails (supporting optional search query)
app.get('/api/emails', async (req, res) => {
  try {
    const gmail = await getGmailClient();
    const query = req.query.q || '';
    const pageToken = req.query.pageToken || undefined;
    
    // Fetch list of message headers
    const listRes = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 15,
      q: query,
      pageToken
    });

    const messages = listRes.data.messages || [];
    const emailPromises = messages.map(async (msg) => {
      const detailRes = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'metadata',
        metadataHeaders: ['Subject', 'From', 'To', 'Date']
      });
      
      const headers = detailRes.data.payload.headers;
      const cachedAnalysis = readJsonFile(CACHE_PATH)[msg.id];
      
      return {
        id: msg.id,
        threadId: msg.threadId,
        subject: getHeader(headers, 'Subject') || '(No Subject)',
        from: getHeader(headers, 'From'),
        to: getHeader(headers, 'To'),
        date: getHeader(headers, 'Date'),
        snippet: detailRes.data.snippet,
        labelIds: detailRes.data.labelIds,
        isRead: !detailRes.data.labelIds.includes('UNREAD'),
        aiAnalysis: cachedAnalysis || null
      };
    });

    const emails = await Promise.all(emailPromises);
    res.json({ emails, nextPageToken: listRes.data.nextPageToken || null });
  } catch (err) {
    console.error('Error listing emails:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get individual email details and run/load AI analysis
app.get('/api/emails/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const gmail = await getGmailClient();
    
    const message = await gmail.users.messages.get({
      userId: 'me',
      id: id,
      format: 'full'
    });

    const headers = message.data.payload.headers;
    const bodyRaw = getEmailBody(message.data.payload);
    const isHtml = message.data.payload.parts ? !!findMimeType(message.data.payload.parts, 'text/html') : false;
    
    // Parse the display date
    const dateStr = getHeader(headers, 'Date');
    
    // Retrieve cached analysis if exists
    let cache = readJsonFile(CACHE_PATH);
    let aiAnalysis = cache[id] || null;

    // Check if we need to auto-analyze
    const shouldAutoAnalyze = !aiAnalysis && process.env.GEMINI_API_KEY;
    if (shouldAutoAnalyze) {
      try {
        aiAnalysis = await runAIAnalysis(
          getHeader(headers, 'Subject'),
          getHeader(headers, 'From'),
          dateStr,
          stripHtml(bodyRaw)
        );
        cache[id] = aiAnalysis;
        writeJsonFile(CACHE_PATH, cache);
      } catch (geminiError) {
        console.error('Gemini auto-analysis failed:', geminiError);
        // Don't crash the email load if Gemini fails, just return null for analysis
      }
    }

    const emailDetails = {
      id: message.data.id,
      threadId: message.data.threadId,
      subject: getHeader(headers, 'Subject') || '(No Subject)',
      from: getHeader(headers, 'From'),
      to: getHeader(headers, 'To'),
      date: dateStr,
      snippet: message.data.snippet,
      body: bodyRaw,
      isHtml: isHtml,
      labelIds: message.data.labelIds,
      isRead: !message.data.labelIds.includes('UNREAD'),
      aiAnalysis
    };

    // Mark email as read dynamically if unread
    if (message.data.labelIds.includes('UNREAD')) {
      try {
        await gmail.users.messages.modify({
          userId: 'me',
          id: id,
          requestBody: {
            removeLabelIds: ['UNREAD']
          }
        });
        emailDetails.isRead = true;
      } catch (modifyErr) {
        console.error('Failed to mark email as read:', modifyErr);
      }
    }

    res.json(emailDetails);
  } catch (err) {
    console.error('Error fetching email:', err);
    res.status(500).json({ error: err.message });
  }
});

// Force manual AI re-analysis of email
app.post('/api/emails/:id/analyze', async (req, res) => {
  try {
    const { id } = req.params;
    const gmail = await getGmailClient();

    const message = await gmail.users.messages.get({
      userId: 'me',
      id: id,
      format: 'full'
    });

    const headers = message.data.payload.headers;
    const bodyRaw = getEmailBody(message.data.payload);
    const cleanBody = stripHtml(bodyRaw);

    const aiAnalysis = await runAIAnalysis(
      getHeader(headers, 'Subject'),
      getHeader(headers, 'From'),
      getHeader(headers, 'Date'),
      cleanBody
    );

    // Save to cache
    const cache = readJsonFile(CACHE_PATH);
    cache[id] = aiAnalysis;
    writeJsonFile(CACHE_PATH, cache);

    res.json({ success: true, aiAnalysis });
  } catch (err) {
    console.error('Error manual analyzing email:', err);
    res.status(500).json({ error: err.message });
  }
});

// Call Gemini API to analyze email (summarize, categorize, extract actions)
async function runAIAnalysis(subject, from, date, textBody) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is not configured.');
  }

  const ai = new GoogleGenAI({ apiKey });
  const model = 'gemini-2.5-flash';

  const systemInstructions = `
You are an expert AI email coordinator. Analyze the provided email and output a structured JSON response containing:
1. "summary": A concise 1-2 sentence summary capturing the core intent of the email.
2. "category": A classification of the email into one of these exact values: "Primary" (important conversations, direct personal/work queries), "Updates" (automatic alerts, bills, transactions, confirmations), "Promotions" (deals, ads, offers, generic marketing), "Social" (newsletters, social networks, friend updates), "Forums" (discussion threads, forums), or "Spam".
3. "categoryReason": A single brief sentence explaining why it fits this category.
4. "actionItems": An array of strings detailing key tasks, responses, or follow-ups requested from the recipient. If no actions are required, return an empty array.

Return ONLY a valid JSON object matching this schema:
{
  "summary": "string",
  "category": "string",
  "categoryReason": "string",
  "actionItems": ["string"]
}
  `;

  const emailPayload = `
Subject: ${subject}
From: ${from}
Date: ${date}
Body Content:
${textBody.substring(0, 8000)} // Limiting token usage safely
  `;

  const response = await ai.models.generateContent({
    model,
    contents: emailPayload,
    config: {
      systemInstruction: systemInstructions,
      responseMimeType: 'application/json'
    }
  });

  const responseText = response.text || '';
  try {
    return JSON.parse(responseText);
  } catch (jsonErr) {
    console.error('Failed to parse Gemini JSON output, response text was:', responseText);
    // Attempt cleaning regex if markdown fence block remains
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  }
}

// Translate natural language search query to Gmail Search query syntax
app.post('/api/emails/search-nl', async (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(400).json({ error: 'Gemini API key is not configured.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-2.5-flash';
    
    // We provide today's date so the AI can resolve relative terms like "last week", "yesterday", etc.
    const today = new Date().toISOString().split('T')[0];

    const systemPrompt = `
You are an expert search query translator for Gmail. 
Convert the user's natural language request into a valid, optimized Gmail search query string.
Gmail syntax filters you can use:
- 'from:name/email'
- 'to:name/email'
- 'subject:word'
- 'label:labelname' (e.g. 'label:unread', 'label:starred')
- 'after:YYYY/MM/DD', 'before:YYYY/MM/DD'
- 'has:attachment'
- double quotes for exact phrases (e.g. "budget proposal")
- OR, AND, - (exclusion)

Rules:
1. Today's date is: ${today}. Use this to resolve relative date requests (e.g. "last week", "since Monday").
2. Standard search terms should just be keywords.
3. Be highly accurate. Do NOT make up queries.
4. Output ONLY the raw query string. No explanations, no markdown formatting (like \`\`\` or \`\`\`gmail). Just the text query.

Example conversions:
- "emails from John about the lunch plans last week" -> "from:John lunch after:2026/06/25 before:2026/07/02"
- "unread receipts from amazon" -> "label:unread from:amazon receipts"
- "urgent budget proposal emails" -> "urgent \\"budget proposal\\""
    `;

    const response = await ai.models.generateContent({
      model,
      contents: `Translate this query: "${query}"`,
      config: {
        systemInstruction: systemPrompt
      }
    });

    const parsedQuery = response.text.trim();
    console.log(`Translated NL query "${query}" to Gmail query "${parsedQuery}"`);
    res.json({ translatedQuery: parsedQuery });
  } catch (err) {
    console.error('Error translating query with Gemini:', err);
    res.status(500).json({ error: 'Failed to translate search query' });
  }
});

// Call Gemini API to draft a reply
app.post('/api/emails/:id/draft-reply', async (req, res) => {
  const { id } = req.params;
  const { tone, instructions } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(400).json({ error: 'Gemini API key is not configured.' });
  }

  try {
    const gmail = await getGmailClient();
    const message = await gmail.users.messages.get({
      userId: 'me',
      id: id,
      format: 'full'
    });

    const headers = message.data.payload.headers;
    const fromStr = getHeader(headers, 'From');
    const subjectStr = getHeader(headers, 'Subject');
    const bodyStr = stripHtml(getEmailBody(message.data.payload));

    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-2.5-flash';

    const systemPrompt = `
You are a helpful AI assistant. Draft an email reply in response to the email provided.
Tailor the reply based on the chosen tone and additional instructions.
Tones:
- "Professional": Formal, polite, clear, grammatically flawless, business-like.
- "Friendly": Warm, casual, enthusiastic, polite but relaxed.
- "Short/Direct": Bulleted or very brief, straight to the point, time-saving.
- "Apologetic": Expressing genuine regret, helpful, solution-oriented.

Rules:
1. Make sure to respond to any direct questions or key points raised in the original email.
2. Use placeholder tags like [My Name] or [Your Name] for the signature unless you can infer it.
3. Output ONLY the response body text. No greetings, headers, intro, subject lines, or markdown boxes. Just the raw text of the reply.
    `;

    const prompt = `
Tone: ${tone || 'Professional'}
Additional Instructions: ${instructions || 'None'}

Original Email:
From: ${fromStr}
Subject: ${subjectStr}
Body:
${bodyStr.substring(0, 8000)}
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: systemPrompt
      }
    });

    res.json({ draftReply: response.text });
  } catch (err) {
    console.error('Error drafting reply:', err);
    res.status(500).json({ error: err.message });
  }
});

// Send an email reply
app.post('/api/emails/:id/send-reply', async (req, res) => {
  const { id } = req.params;
  const { replyText } = req.body;

  if (!replyText) {
    return res.status(400).json({ error: 'Reply text is required' });
  }

  try {
    const gmail = await getGmailClient();
    
    // Fetch parent email to get headers for reply threading
    const parentMsg = await gmail.users.messages.get({
      userId: 'me',
      id: id,
      format: 'metadata',
      metadataHeaders: ['Message-ID', 'Subject', 'From', 'References']
    });

    const headers = parentMsg.data.payload.headers;
    const parentMessageId = getHeader(headers, 'Message-ID');
    const parentSubject = getHeader(headers, 'Subject');
    const parentFrom = getHeader(headers, 'From');
    const parentReferences = getHeader(headers, 'References') || '';

    // Determine the subject (prefix with Re: if not already present)
    let subject = parentSubject;
    if (subject && !subject.toLowerCase().startsWith('re:')) {
      subject = 'Re: ' + subject;
    }

    // Determine recipient: send back to the person who emailed us
    const to = parentFrom;

    // Construct the email content with headers for threading
    const emailLines = [
      `To: ${to}`,
      `Subject: ${subject}`,
      `In-Reply-To: ${parentMessageId}`,
      `References: ${parentReferences ? parentReferences + ' ' + parentMessageId : parentMessageId}`,
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0',
      '',
      replyText
    ];

    const emailRaw = emailLines.join('\r\n');
    const encodedEmail = Buffer.from(emailRaw)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const sentMsg = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail,
        threadId: parentMsg.data.threadId
      }
    });

    // Optionally mark the parent email as replied or add a label if desired
    // Here we will also cache the draft/reply in the frontend local state.
    res.json({ success: true, messageId: sentMsg.data.id, threadId: sentMsg.data.threadId });
  } catch (err) {
    console.error('Error sending reply:', err);
    res.status(500).json({ error: err.message });
  }
});
// Compose and send a new email from scratch
app.post('/api/emails/compose', async (req, res) => {
  const { to, subject, body } = req.body;

  if (!to || !subject || !body) {
    return res.status(400).json({ error: 'Recipient (to), subject, and body are required.' });
  }

  try {
    const gmail = await getGmailClient();

    const emailLines = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0',
      '',
      body
    ];

    const emailRaw = emailLines.join('\r\n');
    const encodedEmail = Buffer.from(emailRaw)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const sentMsg = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail
      }
    });

    res.json({ success: true, messageId: sentMsg.data.id });
  } catch (err) {
    console.error('Error composing new email:', err);
    res.status(500).json({ error: err.message });
  }
});

// Assistant Command Interpreter
app.post('/api/assistant/command', async (req, res) => {
  const { command } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!command) {
    return res.status(400).json({ error: 'Command string is required.' });
  }

  if (!apiKey) {
    return res.status(400).json({ error: 'Gemini API key is not configured.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-2.5-flash';
    const today = new Date().toISOString().split('T')[0];

    const systemPrompt = `
You are Assy, the helpful voice-and-text email copilot.
Interpret the user's spoken or typed instruction.
Supported intents:
1. "send_email": The user wants to send/draft a new email.
   Parameters:
   - "to": Recipient email address (extract if present). If not present, set to null.
   - "subject": Email subject line. If not directly specified, write a short, relevant subject based on the context.
   - "body": Full professional body content of the email. If the user only gave a brief summary (e.g. "tell him I will be late"), expand it into a polite, complete, professional message. Sign off with "[Your Name]".
2. "search_emails": The user wants to find, filter, or look up emails.
   Parameters:
   - "query": Natural language search query translated to Gmail query (e.g. "from:boss lunch").
3. "unknown": If you cannot determine the intent or if it's unsupported.

Return ONLY a valid JSON object matching this schema:
{
  "intent": "send_email" | "search_emails" | "unknown",
  "parameters": {
    "to": "string or null",
    "subject": "string or null",
    "body": "string or null",
    "query": "string or null"
  },
  "responseMessage": "A friendly confirmation from Assy explaining what action is being taken (e.g., 'Sure, I will draft an email to John. Here is the draft I prepared:')"
}

Contextual references:
- Today's date is: ${today}. Use this to resolve relative dates (e.g. "last week", "yesterday").
- If the user specifies a name instead of an email (e.g., "email John"), try to extract "John" as the recipient name. If no domain is provided, output "john@example.com" or the name itself so the user can complete it. If they say "send email to john@gmail.com", extract the full email.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: `User command: "${command}"`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text.trim());
    res.json(parsed);
  } catch (err) {
    console.error('Error processing assistant command:', err);
    res.status(500).json({ error: 'Failed to process command' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
