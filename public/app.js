// Assy - Frontend Application Controller

// Global App State
const state = {
  configured: false,
  authenticated: false,
  searchMode: 'gmail', // 'gmail' or 'ai'
  activeQuery: '',
  activeCategory: 'ALL',
  emails: [],
  selectedEmail: null,
  selectedTone: 'Professional'
};

// UI Elements
const el = {
  setupScreen: document.getElementById('setup-screen'),
  loginScreen: document.getElementById('login-screen'),
  dashboardScreen: document.getElementById('dashboard-screen'),
  setupForm: document.getElementById('setup-form'),
  setupGeminiKey: document.getElementById('setup-gemini-key'),
  setupClientId: document.getElementById('setup-client-id'),
  setupClientSecret: document.getElementById('setup-client-secret'),
  setupRedirectUri: document.getElementById('setup-redirect-uri'),
  btnLogin: document.getElementById('btn-login'),
  btnLogout: document.getElementById('btn-logout'),
  btnRefresh: document.getElementById('btn-refresh'),
  btnSearch: document.getElementById('btn-search'),
  btnClearSearch: document.getElementById('btn-clear-search'),
  btnResetList: document.getElementById('btn-reset-list'),
  searchInput: document.getElementById('search-input'),
  searchModeGmail: document.getElementById('search-mode-gmail'),
  searchModeAi: document.getElementById('search-mode-ai'),
  activeQueryTag: document.getElementById('active-query-tag'),
  listStatusBar: document.getElementById('list-status-bar'),
  listStatusText: document.getElementById('list-status-text'),
  emailListContainer: document.getElementById('email-list-container'),
  detailPlaceholder: document.getElementById('detail-placeholder'),
  detailLoading: document.getElementById('detail-loading'),
  detailContent: document.getElementById('detail-content'),
  detailSubject: document.getElementById('detail-subject'),
  detailFrom: document.getElementById('detail-from'),
  detailTo: document.getElementById('detail-to'),
  detailDate: document.getElementById('detail-date'),
  detailSenderAvatar: document.getElementById('detail-sender-avatar'),
  aiSummary: document.getElementById('ai-summary'),
  aiCategoryBadge: document.getElementById('ai-category-badge'),
  aiCategoryReason: document.getElementById('ai-category-reason'),
  aiActionsList: document.getElementById('ai-actions-list'),
  btnReanalyze: document.getElementById('btn-reanalyze'),
  emailBodyIframe: document.getElementById('email-body-iframe'),
  emailBodyText: document.getElementById('email-body-text'),
  draftInstructions: document.getElementById('draft-instructions'),
  btnGenerateDraft: document.getElementById('btn-generate-draft'),
  draftEditorContainer: document.getElementById('draft-editor-container'),
  draftTextarea: document.getElementById('draft-textarea'),
  btnSendReply: document.getElementById('btn-send-reply'),
  draftStatusIndicator: document.getElementById('draft-status-indicator'),
  
  // Category counters
  countAll: document.getElementById('count-all'),
  countPrimary: document.getElementById('count-primary'),
  countUpdates: document.getElementById('count-updates'),
  countPromotions: document.getElementById('count-promotions'),
  countSocial: document.getElementById('count-social'),
  countForums: document.getElementById('count-forums'),
  
  // Nav buttons
  navItems: document.querySelectorAll('.nav-item'),

  // Assy Voice Assistant Elements
  btnAssyFab: document.getElementById('btn-assy-fab'),
  assyModal: document.getElementById('assy-modal'),
  btnCloseAssy: document.getElementById('btn-close-assy'),
  btnAssyMic: document.getElementById('btn-assy-mic'),
  btnAssySend: document.getElementById('btn-assy-send'),
  assyCommandInput: document.getElementById('assy-command-input'),
  voiceWaves: document.getElementById('voice-waves'),
  assyStatusText: document.getElementById('assy-status-text'),
  assyDialogBox: document.getElementById('assy-dialog-box'),
  assySpeechBubble: document.getElementById('assy-speech-bubble'),
  composeDraftCard: document.getElementById('compose-draft-card'),
  composeTo: document.getElementById('compose-to'),
  composeSubject: document.getElementById('compose-subject'),
  composeBody: document.getElementById('compose-body'),
  btnCancelCompose: document.getElementById('btn-cancel-compose'),
  btnSendCompose: document.getElementById('btn-send-compose')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initApp();
  setupEventListeners();
});

// Main Setup Checks
async function initApp() {
  try {
    const configRes = await fetch('/api/config-status');
    const config = await configRes.json();
    state.configured = config.configured;

    if (!state.configured) {
      showScreen('setup');
      return;
    }

    const authRes = await fetch('/api/auth/status');
    const auth = await authRes.json();
    state.authenticated = auth.authenticated;

    if (!state.authenticated) {
      showScreen('login');
    } else {
      showScreen('dashboard');
      loadEmails();
    }
  } catch (err) {
    console.error('App initialization error:', err);
    alert('Failed to connect to the local server. Make sure node server is running.');
  }
}

// Screen management router
function showScreen(screenName) {
  el.setupScreen.classList.add('hidden');
  el.loginScreen.classList.add('hidden');
  el.dashboardScreen.classList.add('hidden');

  if (screenName === 'setup') {
    el.setupScreen.classList.remove('hidden');
  } else if (screenName === 'login') {
    el.loginScreen.classList.remove('hidden');
  } else if (screenName === 'dashboard') {
    el.dashboardScreen.classList.remove('hidden');
  }
  lucide.createIcons();
}

// Setup Event Handlers
function setupEventListeners() {
  // Config Save
  el.setupForm.addEventListener('submit', handleConfigSave);

  // Login & Logout
  el.btnLogin.addEventListener('click', handleLogin);
  el.btnLogout.addEventListener('click', handleLogout);

  // Email List controls
  el.btnRefresh.addEventListener('click', () => loadEmails(true));
  el.btnResetList.addEventListener('click', resetSearch);
  
  // Search Bar
  el.btnSearch.addEventListener('click', handleSearch);
  el.searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSearch();
  });
  el.btnClearSearch.addEventListener('click', resetSearch);

  // Search Mode Toggles
  el.searchModeGmail.addEventListener('click', () => setSearchMode('gmail'));
  el.searchModeAi.addEventListener('click', () => setSearchMode('ai'));

  // Nav categories filter
  el.navItems.forEach(item => {
    item.addEventListener('click', () => {
      const cat = item.getAttribute('data-category');
      setCategoryFilter(cat);
    });
  });

  // Tone buttons
  document.querySelectorAll('.btn-tone').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.btn-tone').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      state.selectedTone = e.currentTarget.getAttribute('data-tone');
    });
  });

  // Draft and reply button handlers
  el.btnGenerateDraft.addEventListener('click', handleGenerateDraft);
  el.btnSendReply.addEventListener('click', handleSendReply);
  el.btnReanalyze.addEventListener('click', handleReanalyze);

  // Assy Assistant Dialog controls
  el.btnAssyFab.addEventListener('click', openAssyModal);
  el.btnCloseAssy.addEventListener('click', closeAssyModal);
  el.btnAssySend.addEventListener('click', handleAssySubmit);
  el.assyCommandInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAssySubmit();
  });
  el.btnAssyMic.addEventListener('click', toggleSpeechRecognition);
  el.btnCancelCompose.addEventListener('click', closeAssyModal);
  el.btnSendCompose.addEventListener('click', handleComposeSubmit);
}

// Config Saving Action
async function handleConfigSave(e) {
  e.preventDefault();
  
  const payload = {
    GOOGLE_CLIENT_ID: el.setupClientId.value.trim(),
    GOOGLE_CLIENT_SECRET: el.setupClientSecret.value.trim(),
    GEMINI_API_KEY: el.setupGeminiKey.value.trim(),
    GOOGLE_REDIRECT_URI: el.setupRedirectUri.value.trim()
  };

  try {
    const res = await fetch('/api/save-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    if (data.success) {
      state.configured = true;
      initApp();
    } else {
      alert(`Save configuration failed: ${data.error}`);
    }
  } catch (err) {
    console.error(err);
    alert('Server failed to save configuration.');
  }
}

// Trigger Google Login redirect
async function handleLogin() {
  try {
    const res = await fetch('/api/auth/url');
    const data = await res.json();
    if (data.url) {
      // Redirect in current tab to handle oauth flow
      window.location.href = data.url;
    } else {
      alert('Could not retrieve login URL.');
    }
  } catch (err) {
    console.error(err);
    alert('Failed to connect to Google OAuth.');
  }
}

// Handle Logout
async function handleLogout() {
  if (!confirm('Are you sure you want to log out of Gmail?')) return;
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
    state.authenticated = false;
    showScreen('login');
  } catch (err) {
    console.error(err);
  }
}

// Set Search Engine Mode
function setSearchMode(mode) {
  state.searchMode = mode;
  if (mode === 'gmail') {
    el.searchModeGmail.classList.add('active');
    el.searchModeAi.classList.remove('active');
    el.searchInput.placeholder = 'Search emails (standard syntax)...';
  } else {
    el.searchModeGmail.classList.remove('active');
    el.searchModeAi.classList.add('active');
    el.searchInput.placeholder = 'Search with Gemini (natural language)...';
  }
}

// Set Active Category Filter
function setCategoryFilter(cat) {
  state.activeCategory = cat;
  el.navItems.forEach(item => {
    if (item.getAttribute('data-category') === cat) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  renderEmailList();
}

// Execute Email Search
async function handleSearch() {
  const query = el.searchInput.value.trim();
  if (!query) return;

  state.activeQuery = query;
  
  if (state.searchMode === 'ai') {
    // Translate with Gemini first
    el.btnSearch.disabled = true;
    el.btnSearch.innerHTML = '<div class="spinner" style="width: 14px; height: 14px; border-width: 2px;"></div>';
    
    try {
      const res = await fetch('/api/emails/search-nl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      
      if (data.translatedQuery) {
        state.activeQuery = data.translatedQuery;
        el.activeQueryTag.classList.remove('hidden');
        el.activeQueryTag.querySelector('span').textContent = `AI Translated: ${data.translatedQuery}`;
      } else {
        alert('Gemini could not translate the search query.');
      }
    } catch (err) {
      console.error(err);
      alert('Error translating search with AI.');
    } finally {
      el.btnSearch.disabled = false;
      el.btnSearch.innerHTML = '<i data-lucide="search"></i>';
      lucide.createIcons();
    }
  }

  loadEmails();
}

// Reset Search queries and tags
function resetSearch() {
  state.activeQuery = '';
  el.searchInput.value = '';
  el.activeQueryTag.classList.add('hidden');
  el.listStatusBar.classList.add('hidden');
  loadEmails();
}

// Fetch list of emails
async function loadEmails(isSilent = false) {
  if (!isSilent) {
    el.emailListContainer.innerHTML = `
      <div class="list-placeholder">
        <div class="spinner"></div>
        <p>Syncing inboxes with Gmail...</p>
      </div>
    `;
  }

  try {
    let url = '/api/emails';
    if (state.activeQuery) {
      url += `?q=${encodeURIComponent(state.activeQuery)}`;
      el.listStatusBar.classList.remove('hidden');
      el.listStatusText.textContent = `Search results for: "${state.activeQuery}"`;
    } else {
      el.listStatusBar.classList.add('hidden');
    }

    const res = await fetch(url);
    const data = await res.json();
    
    if (data.emails) {
      state.emails = data.emails;
      renderEmailList();
      updateCategoryCounts();
    } else if (data.error) {
      console.error(data.error);
      el.emailListContainer.innerHTML = `<div class="list-placeholder"><p class="text-rose">Error: ${data.error}</p></div>`;
    }
  } catch (err) {
    console.error(err);
    el.emailListContainer.innerHTML = `<div class="list-placeholder"><p class="text-rose">Network error occurred.</p></div>`;
  }
}

// Render dynamic emails
function renderEmailList() {
  el.emailListContainer.innerHTML = '';
  
  // Filter list by Category if not in ALL mode
  let filtered = state.emails;
  if (state.activeCategory !== 'ALL') {
    filtered = state.emails.filter(email => {
      const aiCat = email.aiAnalysis ? email.aiAnalysis.category : null;
      
      // Fallback: If not yet AI-analyzed, and category matches Gmail's internal label ID mappings
      if (!aiCat) {
        if (state.activeCategory === 'Updates') return email.labelIds.includes('CATEGORY_UPDATES');
        if (state.activeCategory === 'Promotions') return email.labelIds.includes('CATEGORY_PROMOTIONS');
        if (state.activeCategory === 'Social') return email.labelIds.includes('CATEGORY_SOCIAL');
        if (state.activeCategory === 'Forums') return email.labelIds.includes('CATEGORY_FORUMS');
        if (state.activeCategory === 'Primary') return email.labelIds.includes('CATEGORY_PERSONAL') || (!email.labelIds.includes('CATEGORY_UPDATES') && !email.labelIds.includes('CATEGORY_PROMOTIONS') && !email.labelIds.includes('CATEGORY_SOCIAL') && !email.labelIds.includes('CATEGORY_FORUMS'));
        return false;
      }
      
      return aiCat.toLowerCase() === state.activeCategory.toLowerCase();
    });
  }

  if (filtered.length === 0) {
    el.emailListContainer.innerHTML = `
      <div class="list-placeholder">
        <i data-lucide="mail-open" style="width: 24px; height: 24px;"></i>
        <p>No emails found in this category.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  filtered.forEach(email => {
    const isUnread = !email.isRead;
    const item = document.createElement('div');
    item.className = `email-item ${isUnread ? 'unread' : ''} ${state.selectedEmail && state.selectedEmail.id === email.id ? 'active' : ''}`;
    item.setAttribute('data-id', email.id);

    // Format sender display name
    let senderName = email.from.split('<')[0].trim().replace(/"/g, '');
    if (!senderName) senderName = email.from;

    // Format display date
    const dateParsed = new Date(email.date);
    let dateDisplay = email.date;
    if (!isNaN(dateParsed.getTime())) {
      const today = new Date();
      if (dateParsed.toDateString() === today.toDateString()) {
        dateDisplay = dateParsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        dateDisplay = dateParsed.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
    }

    // Determine category tag label
    let catTagHtml = '';
    const aiCat = email.aiAnalysis ? email.aiAnalysis.category : getLabelCategory(email.labelIds);
    if (aiCat) {
      catTagHtml = `<span class="cat-tag cat-tag-${aiCat.toLowerCase()}">${aiCat}</span>`;
    }

    // Unread and Sparkle Indicator
    const indicatorsHtml = `
      <div style="display: flex; align-items: center; gap: 8px;">
        ${email.aiAnalysis ? '<i data-lucide="sparkles" class="ai-sparkle-dot" title="AI Analyzed"></i>' : ''}
        ${isUnread ? '<div class="unread-dot"></div>' : ''}
      </div>
    `;

    item.innerHTML = `
      <div class="email-item-header">
        <span class="email-sender">${senderName}</span>
        <span class="email-date-small">${dateDisplay}</span>
      </div>
      <div class="email-subject-line">
        <span class="email-subject">${email.subject}</span>
        ${indicatorsHtml}
      </div>
      <div class="email-snippet">${email.snippet}</div>
      <div style="margin-top: 8px; display: flex; justify-content: space-between; align-items: center;">
        ${catTagHtml}
      </div>
    `;

    item.addEventListener('click', () => selectEmail(email.id));
    el.emailListContainer.appendChild(item);
  });

  lucide.createIcons();
}

// Retrieve internal label IDs fallback category
function getLabelCategory(labelIds) {
  if (labelIds.includes('CATEGORY_PERSONAL')) return 'Primary';
  if (labelIds.includes('CATEGORY_UPDATES')) return 'Updates';
  if (labelIds.includes('CATEGORY_PROMOTIONS')) return 'Promotions';
  if (labelIds.includes('CATEGORY_SOCIAL')) return 'Social';
  if (labelIds.includes('CATEGORY_FORUMS')) return 'Forums';
  return null;
}

// Update Nav Category Counts dynamically
function updateCategoryCounts() {
  let counts = { ALL: state.emails.length, Primary: 0, Updates: 0, Promotions: 0, Social: 0, Forums: 0 };

  state.emails.forEach(email => {
    const aiCat = email.aiAnalysis ? email.aiAnalysis.category : getLabelCategory(email.labelIds);
    if (aiCat) {
      const formatCat = aiCat.charAt(0).toUpperCase() + aiCat.slice(1).toLowerCase();
      if (counts.hasOwnProperty(formatCat)) {
        counts[formatCat]++;
      }
    } else {
      counts['Primary']++; // Fallback default
    }
  });

  el.countAll.textContent = counts.ALL;
  el.countPrimary.textContent = counts.Primary;
  el.countUpdates.textContent = counts.Updates;
  el.countPromotions.textContent = counts.Promotions;
  el.countSocial.textContent = counts.Social;
  el.countForums.textContent = counts.Forums;
}

// Load Email Detail Pane content
async function selectEmail(emailId) {
  // Highlight active selected item in list
  document.querySelectorAll('.email-item').forEach(item => {
    if (item.getAttribute('data-id') === emailId) {
      item.classList.add('active');
      item.classList.remove('unread');
      const dot = item.querySelector('.unread-dot');
      if (dot) dot.remove();
    } else {
      item.classList.remove('active');
    }
  });

  el.detailPlaceholder.classList.add('hidden');
  el.detailContent.classList.add('hidden');
  el.detailLoading.classList.remove('hidden');

  try {
    const res = await fetch(`/api/emails/${emailId}`);
    const email = await res.json();
    
    state.selectedEmail = email;

    // Refresh email inside main state list as read & with updated AI analysis
    const listIndex = state.emails.findIndex(e => e.id === emailId);
    if (listIndex !== -1) {
      state.emails[listIndex].isRead = true;
      state.emails[listIndex].aiAnalysis = email.aiAnalysis;
      renderEmailList();
      updateCategoryCounts();
    }

    renderEmailDetails(email);
  } catch (err) {
    console.error(err);
    el.detailPlaceholder.querySelector('h3').textContent = 'Error loading email';
    el.detailPlaceholder.querySelector('p').textContent = err.message;
    el.detailPlaceholder.classList.remove('hidden');
    el.detailLoading.classList.add('hidden');
  }
}

// Render content of email details
function renderEmailDetails(email) {
  el.detailLoading.classList.add('hidden');
  el.detailContent.classList.remove('hidden');

  el.detailSubject.textContent = email.subject;
  el.detailFrom.textContent = email.from;
  el.detailTo.textContent = email.to;
  el.detailDate.textContent = new Date(email.date).toLocaleString();

  // Create Avatar Icon
  let initText = 'U';
  const match = email.from.match(/^"?([^"<]+)"?/);
  if (match && match[1]) {
    initText = match[1].trim().charAt(0).toUpperCase();
  } else {
    initText = email.from.charAt(0).toUpperCase();
  }
  el.detailSenderAvatar.textContent = initText;

  // Render HTML / Plain body inside iframe
  const iframe = el.emailBodyIframe;
  const textBody = el.emailBodyText;
  
  if (email.isHtml) {
    iframe.classList.remove('hidden');
    textBody.classList.add('hidden');
    
    // Reset initial fallback height
    iframe.style.height = '450px';
    
    // Inject email safely inside iframe with sandbox styling
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    
    // Set viewport scaling and normalize font styles so email fits nicely
    const fontFixCss = `
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
          font-size: 15px; 
          line-height: 1.5; 
          color: #374151; 
          word-break: break-word;
          padding: 16px;
          margin: 0;
        }
        img { max-width: 100% !important; height: auto !important; }
      </style>
    `;
    doc.write(fontFixCss + email.body);
    doc.close();

    // Helper to resize iframe to fit content height dynamically
    const resizeIframe = () => {
      setTimeout(() => {
        try {
          const innerDoc = iframe.contentDocument || iframe.contentWindow.document;
          if (innerDoc && innerDoc.body) {
            const newHeight = innerDoc.body.scrollHeight;
            iframe.style.height = (newHeight + 25) + 'px'; // +25px padding
          }
        } catch (e) {
          console.error("Iframe dynamic resize failed:", e);
        }
      }, 150);
    };

    iframe.onload = resizeIframe;
    resizeIframe(); // Run immediately after injection
  } else {
    iframe.classList.add('hidden');
    textBody.classList.remove('hidden');
    textBody.textContent = email.body;
  }

  // Render AI Insights
  renderAIInsights(email.aiAnalysis);

  // Clear/Reset Draft area
  el.draftInstructions.value = '';
  el.draftStatusIndicator.textContent = '';
  el.draftEditorContainer.classList.add('hidden');
  el.draftTextarea.value = '';

  // Scroll details window to top
  document.querySelector('.detail-pane').scrollTop = 0;
  lucide.createIcons();
}

// Render dynamic AI cards
function renderAIInsights(analysis) {
  if (!analysis) {
    el.aiSummary.innerHTML = '<em>Gemini credentials not found or analysis failed. Re-run manually.</em>';
    el.aiCategoryBadge.className = 'cat-pill';
    el.aiCategoryBadge.textContent = '';
    el.aiCategoryReason.textContent = '';
    el.aiActionsList.innerHTML = '<li>Click Re-analyze to generate insights.</li>';
    return;
  }

  el.aiSummary.textContent = analysis.summary;
  
  // Category Pill styling
  const cat = analysis.category;
  el.aiCategoryBadge.textContent = cat;
  el.aiCategoryBadge.className = `cat-pill ${cat}`;
  el.aiCategoryReason.textContent = analysis.categoryReason || '';

  // Action Items
  el.aiActionsList.innerHTML = '';
  if (analysis.actionItems && analysis.actionItems.length > 0) {
    analysis.actionItems.forEach(action => {
      const li = document.createElement('li');
      li.textContent = action;
      el.aiActionsList.appendChild(li);
    });
  } else {
    const li = document.createElement('li');
    li.innerHTML = '<span style="color: var(--text-muted);">No action items detected.</span>';
    el.aiActionsList.appendChild(li);
  }
}

// Request dynamic email analysis re-run
async function handleReanalyze() {
  if (!state.selectedEmail) return;
  
  const originalHtml = el.btnReanalyze.innerHTML;
  el.btnReanalyze.disabled = true;
  el.btnReanalyze.innerHTML = '<div class="spinner" style="width: 12px; height: 12px; border-width: 2px;"></div> &nbsp; Analyzing...';

  try {
    const res = await fetch(`/api/emails/${state.selectedEmail.id}/analyze`, { method: 'POST' });
    const data = await res.json();
    
    if (data.success && data.aiAnalysis) {
      state.selectedEmail.aiAnalysis = data.aiAnalysis;
      renderAIInsights(data.aiAnalysis);
      
      // Update count/list lists
      const listIndex = state.emails.findIndex(e => e.id === state.selectedEmail.id);
      if (listIndex !== -1) {
        state.emails[listIndex].aiAnalysis = data.aiAnalysis;
        renderEmailList();
        updateCategoryCounts();
      }
    } else {
      alert('AI re-analysis failed.');
    }
  } catch (err) {
    console.error(err);
    alert('Connection error during AI re-analysis.');
  } finally {
    el.btnReanalyze.disabled = false;
    el.btnReanalyze.innerHTML = originalHtml;
    lucide.createIcons();
  }
}

// Generate email draft reply
async function handleGenerateDraft() {
  if (!state.selectedEmail) return;

  const btnHtml = el.btnGenerateDraft.innerHTML;
  el.btnGenerateDraft.disabled = true;
  el.btnGenerateDraft.innerHTML = '<div class="spinner" style="width: 14px; height: 14px; border-width: 2px;"></div> &nbsp; Drafting Reply...';
  el.draftStatusIndicator.textContent = 'Gemini is drafting a response...';
  el.draftStatusIndicator.style.color = 'var(--text-secondary)';

  try {
    const res = await fetch(`/api/emails/${state.selectedEmail.id}/draft-reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tone: state.selectedTone,
        instructions: el.draftInstructions.value.trim()
      })
    });

    const data = await res.json();
    
    if (data.draftReply) {
      el.draftTextarea.value = data.draftReply;
      el.draftEditorContainer.classList.remove('hidden');
      el.draftStatusIndicator.textContent = 'Draft created!';
      el.draftStatusIndicator.style.color = 'var(--color-success)';
      
      // Auto scroll down to review
      setTimeout(() => {
        el.draftTextarea.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
    } else {
      el.draftStatusIndicator.textContent = 'Failed to generate draft.';
      el.draftStatusIndicator.style.color = 'var(--color-danger)';
      alert(data.error || 'Unknown error occurred while generating reply.');
    }
  } catch (err) {
    console.error(err);
    el.draftStatusIndicator.textContent = 'Connection error.';
    el.draftStatusIndicator.style.color = 'var(--color-danger)';
  } finally {
    el.btnGenerateDraft.disabled = false;
    el.btnGenerateDraft.innerHTML = btnHtml;
    lucide.createIcons();
  }
}

// Send the actual reply
async function handleSendReply() {
  if (!state.selectedEmail) return;
  const replyText = el.draftTextarea.value.trim();
  
  if (!replyText) {
    alert('Please review and fill in the draft content before sending.');
    return;
  }

  if (!confirm('Are you sure you want to send this email reply?')) return;

  const btnHtml = el.btnSendReply.innerHTML;
  el.btnSendReply.disabled = true;
  el.btnSendReply.innerHTML = '<div class="spinner" style="width: 14px; height: 14px; border-width: 2px;"></div> &nbsp; Sending...';

  try {
    const res = await fetch(`/api/emails/${state.selectedEmail.id}/send-reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ replyText })
    });

    const data = await res.json();

    if (data.success) {
      el.draftStatusIndicator.textContent = 'Reply sent successfully!';
      el.draftStatusIndicator.style.color = 'var(--color-success)';
      el.draftEditorContainer.classList.add('hidden');
      el.draftTextarea.value = '';
      alert('Your email reply has been sent.');
    } else {
      alert(`Send reply failed: ${data.error}`);
    }
  } catch (err) {
    console.error(err);
    alert('Network error occurred sending reply.');
  } finally {
    el.btnSendReply.disabled = false;
    el.btnSendReply.innerHTML = btnHtml;
    lucide.createIcons();
  }
}

// ========================================================
// ASSY VOICE & TEXT ASSISTANT CONTROLLER
// ========================================================

// Speech Recognition Global Setup
let recognition = null;
let isListening = false;

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SpeechObj = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechObj();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  recognition.onstart = () => {
    isListening = true;
    el.btnAssyMic.classList.add('active');
    el.voiceWaves.classList.add('listening');
    el.assyStatusText.textContent = "Listening to your voice... Speak now.";
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    el.assyCommandInput.value = transcript;
    el.assyStatusText.textContent = `Heard: "${transcript}"`;
    submitAssyCommand(transcript);
  };

  recognition.onerror = (event) => {
    console.error("Speech Recognition error:", event.error);
    el.assyStatusText.textContent = `Speech error: ${event.error}. Please type below.`;
    stopSpeechRecognition();
  };

  recognition.onend = () => {
    stopSpeechRecognition();
  };
}

function toggleSpeechRecognition() {
  if (!recognition) {
    alert("Speech recognition is not supported in this browser. Please type your command.");
    return;
  }

  if (isListening) {
    recognition.stop();
  } else {
    try {
      el.assyCommandInput.value = '';
      recognition.start();
    } catch (e) {
      console.error(e);
    }
  }
}

function stopSpeechRecognition() {
  isListening = false;
  el.btnAssyMic.classList.remove('active');
  el.voiceWaves.classList.remove('listening');
}

// Open Assy Dialog Modal
function openAssyModal() {
  el.assyModal.classList.remove('hidden');
  el.assyCommandInput.value = '';
  el.assyStatusText.textContent = "Click the microphone to speak, or type your command below.";
  el.assyDialogBox.classList.add('hidden');
  el.composeDraftCard.classList.add('hidden');
  stopSpeechRecognition();
  lucide.createIcons();
}

// Close Assy Dialog Modal
function closeAssyModal() {
  el.assyModal.classList.add('hidden');
  stopSpeechRecognition();
}

// Submit Assistant command
async function handleAssySubmit() {
  const cmd = el.assyCommandInput.value.trim();
  if (!cmd) return;
  submitAssyCommand(cmd);
}

// Process Command with backend & Gemini
async function submitAssyCommand(command) {
  // Show thinking status
  el.assyStatusText.textContent = "Assy is interpreting command...";
  el.voiceWaves.classList.add('listening'); // Animate visualizer waves slowly
  el.btnAssySend.disabled = true;
  el.btnAssySend.innerHTML = '<div class="spinner" style="width: 14px; height: 14px; border-width: 2px;"></div>';
  
  // Set speech bubble details
  el.assySpeechBubble.textContent = "Thinking...";
  el.assyDialogBox.classList.remove('hidden');
  el.composeDraftCard.classList.add('hidden');

  try {
    const res = await fetch('/api/assistant/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command })
    });
    
    const data = await res.json();
    
    // Stop waves animation
    el.voiceWaves.classList.remove('listening');

    if (data.error) {
      el.assySpeechBubble.textContent = `Sorry, I ran into an error: ${data.error}`;
      el.assyStatusText.textContent = "Ready.";
      return;
    }

    el.assySpeechBubble.textContent = data.responseMessage;
    
    if (data.intent === 'send_email') {
      // Show Compose Draft Review card
      el.composeTo.value = data.parameters.to || '';
      el.composeSubject.value = data.parameters.subject || '';
      el.composeBody.value = data.parameters.body || '';
      
      el.composeDraftCard.classList.remove('hidden');
      el.assyStatusText.textContent = "Please review the email draft details below and click Send.";
      
      // Scroll card into view
      setTimeout(() => {
        el.composeDraftCard.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);

    } else if (data.intent === 'search_emails') {
      el.assyStatusText.textContent = "Executing search query...";
      
      // Apply search to standard UI
      state.searchMode = 'ai';
      el.searchModeGmail.classList.remove('active');
      el.searchModeAi.classList.add('active');
      el.searchInput.value = command;
      
      state.activeQuery = data.parameters.query;
      el.activeQueryTag.classList.remove('hidden');
      el.activeQueryTag.querySelector('span').textContent = `AI Translated: ${data.parameters.query}`;

      loadEmails();

      // Close modal after brief delay so user sees confirmation
      setTimeout(() => {
        closeAssyModal();
      }, 1500);
    } else {
      el.assyStatusText.textContent = "Try asking differently (e.g. 'Email John to say thank you').";
    }

  } catch (err) {
    console.error(err);
    el.assySpeechBubble.textContent = "I was unable to communicate with the server command interpreter.";
    el.assyStatusText.textContent = "Ready.";
    el.voiceWaves.classList.remove('listening');
  } finally {
    el.btnAssySend.disabled = false;
    el.btnAssySend.innerHTML = '<i data-lucide="arrow-right"></i>';
    lucide.createIcons();
  }
}

// Handle Compose Form Submit (Send the actual new email)
async function handleComposeSubmit() {
  const to = el.composeTo.value.trim();
  const subject = el.composeSubject.value.trim();
  const body = el.composeBody.value.trim();

  if (!to || !subject || !body) {
    alert("Please fill in recipient (To), Subject, and Message body before sending.");
    return;
  }

  el.btnSendCompose.disabled = true;
  const originalHtml = el.btnSendCompose.innerHTML;
  el.btnSendCompose.innerHTML = '<div class="spinner" style="width: 14px; height: 14px; border-width: 2px;"></div> &nbsp; Sending...';

  try {
    const res = await fetch('/api/emails/compose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, body })
    });

    const data = await res.json();
    
    if (data.success) {
      el.composeDraftCard.classList.add('hidden');
      el.assySpeechBubble.textContent = `Successfully sent email to ${to}!`;
      el.assyStatusText.textContent = "Email sent.";
      
      // Refresh mailbox
      loadEmails(true);

      // Close modal after brief delay
      setTimeout(() => {
        closeAssyModal();
      }, 1500);
    } else {
      alert(`Send email failed: ${data.error}`);
    }
  } catch (err) {
    console.error(err);
    alert("Connection error sending new email.");
  } finally {
    el.btnSendCompose.disabled = false;
    el.btnSendCompose.innerHTML = originalHtml;
    lucide.createIcons();
  }
}

