class EchoPanel {
  constructor() {
    this.isOpen = false;
    this.panel = null;
    this.floatingBtn = null;
    this.currentView = 'list'; // 'list' or 'form'
    this.prompts = [];
    this.editingPrompt = null;
    this.init();
  }

  init() {
    // Load prompts from storage
    this.loadPrompts().then(() => {
      // Create floating button
      this.createFloatingButton();

      // Create panel
      this.createPanel();

      // Setup event listeners
      this.setupListeners();
    });
  }

  async loadPrompts() {
    return new Promise((resolve) => {
      chrome.storage.local.get('echoPrompts', (data) => {
        this.prompts = data.echoPrompts || [];
        resolve();
      });
    });
  }

  async savePrompts() {
    return new Promise((resolve) => {
      chrome.storage.local.set({ echoPrompts: this.prompts }, resolve);
    });
  }

  createFloatingButton() {
    this.floatingBtn = document.createElement('button');
    this.floatingBtn.id = 'echo-floating-btn';
    this.floatingBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>
        <path d="m15 5 4 4"/>
      </svg>
    `;

    this.floatingBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle();
    });

    document.body.appendChild(this.floatingBtn);
  }

  createPanel() {
    this.panel = document.createElement('div');
    this.panel.id = 'echo-panel';
    this.renderPanel();
    document.body.appendChild(this.panel);
  }

  renderPanel() {
    if (this.currentView === 'list') {
      this.panel.innerHTML = this.renderListView();
    } else {
      this.panel.innerHTML = this.renderFormView();
    }
    this.attachPanelListeners();
  }

  renderListView() {
    const promptsHTML = this.prompts.length > 0
      ? this.prompts.map((prompt, index) => this.renderPromptCard(prompt, index)).join('')
      : this.renderEmptyState();

    return `
      <div class="echo-content">
        <div class="echo-header">
          <div class="echo-title">Saved Prompts (${this.prompts.length})</div>
          <button class="echo-btn-new" data-action="new-prompt">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14"/>
              <path d="M12 5v14"/>
            </svg>
            New
          </button>
        </div>
        <div class="echo-prompts-list">
          ${promptsHTML}
        </div>
      </div>
    `;
  }

  renderPromptCard(prompt, index) {
    const timeAgo = this.getTimeAgo(prompt.savedAt);
    const truncatedText = prompt.text.length > 150
      ? prompt.text.substring(0, 150) + '...'
      : prompt.text;

    return `
      <div class="echo-prompt-card">
        <div class="echo-prompt-header">${this.escapeHtml(prompt.description)}</div>
        <div class="echo-prompt-text">${this.escapeHtml(truncatedText)}</div>
        <div class="echo-prompt-meta">
          <span>${prompt.text.length} chars</span>
          <span>${timeAgo}</span>
        </div>
        <div class="echo-prompt-actions">
          <button class="echo-btn-small echo-btn-copy" data-action="copy" data-index="${index}">Copy</button>
          <button class="echo-btn-small echo-btn-delete" data-action="delete" data-index="${index}">Delete</button>
        </div>
      </div>
    `;
  }

  renderEmptyState() {
    return `
      <div class="echo-empty">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
          <path d="M12 9v4"/>
          <path d="M12 17h.01"/>
        </svg>
        <div class="echo-empty-title">No prompts saved yet</div>
        <div class="echo-empty-text">Highlight text and right-click "Save to Echo" or click the + button</div>
      </div>
    `;
  }

  renderFormView() {
    const description = this.editingPrompt?.description || '';
    const text = this.editingPrompt?.text || '';
    const charCount = text.length;

    return `
      <div class="echo-content">
        <div class="echo-header">
          <div class="echo-title">${this.editingPrompt ? 'Edit Prompt' : 'Save New Prompt'}</div>
        </div>
        <form class="echo-form" id="echo-prompt-form">
          <div class="echo-form-group">
            <label class="echo-label">Description</label>
            <input
              type="text"
              class="echo-input"
              id="echo-description"
              placeholder="e.g., Blog post prompt"
              value="${this.escapeHtml(description)}"
              required
            />
          </div>
          <div class="echo-form-group">
            <label class="echo-label">Prompt</label>
            <textarea
              class="echo-textarea"
              id="echo-prompt-text"
              placeholder="Type or paste your prompt here..."
              required
            >${this.escapeHtml(text)}</textarea>
            <div class="echo-char-count" id="echo-char-count">${charCount} characters</div>
          </div>
          <div class="echo-btn-group">
            <button type="button" class="echo-btn echo-btn-secondary" data-action="cancel">Cancel</button>
            <button type="submit" class="echo-btn echo-btn-primary">Save Prompt</button>
          </div>
        </form>
      </div>
    `;
  }

  attachPanelListeners() {
    // Action buttons
    this.panel.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const action = btn.dataset.action;
        const index = btn.dataset.index;
        this.handleAction(action, index);
      });
    });

    // Form submission
    const form = this.panel.querySelector('#echo-prompt-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleSavePrompt();
      });

      // Character counter
      const textarea = this.panel.querySelector('#echo-prompt-text');
      const charCount = this.panel.querySelector('#echo-char-count');
      if (textarea && charCount) {
        textarea.addEventListener('input', () => {
          charCount.textContent = `${textarea.value.length} characters`;
        });
      }
    }
  }

  async handleAction(action, index) {
    switch (action) {
      case 'new-prompt':
        this.editingPrompt = null;
        this.currentView = 'form';
        this.renderPanel();
        break;

      case 'copy':
        const prompt = this.prompts[index];
        this.copyToClipboard(prompt.text);
        break;

      case 'delete':
        this.prompts.splice(index, 1);
        await this.savePrompts();
        this.renderPanel();
        break;

      case 'cancel':
        this.editingPrompt = null;
        this.currentView = 'list';
        this.renderPanel();
        break;
    }
  }

  async handleSavePrompt() {
    const description = this.panel.querySelector('#echo-description').value.trim();
    const text = this.panel.querySelector('#echo-prompt-text').value.trim();

    if (!description || !text) return;

    const newPrompt = {
      id: Date.now().toString(),
      description,
      text,
      savedAt: Date.now(),
      source: window.location.hostname
    };

    this.prompts.unshift(newPrompt);
    await this.savePrompts();

    this.editingPrompt = null;
    this.currentView = 'list';
    this.renderPanel();
  }

  copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }

  getTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
    return `${Math.floor(seconds / 2592000)}mo ago`;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  setupListeners() {
    // ESC key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Click outside to close
    document.addEventListener('click', (e) => {
      if (this.isOpen &&
          !this.panel.contains(e.target) &&
          !this.floatingBtn.contains(e.target)) {
        this.close();
      }
    });
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.panel.classList.add('echo-visible');
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.panel.classList.remove('echo-visible');

    // Reset to list view when closing
    if (this.currentView === 'form') {
      this.currentView = 'list';
      this.editingPrompt = null;
      this.renderPanel();
    }
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  // Public method to open with pre-filled text (for context menu)
  openWithText(text) {
    this.editingPrompt = { description: '', text };
    this.currentView = 'form';
    this.renderPanel();
    this.open();
  }
}

// Initialize
const echoPanel = new EchoPanel();

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'TOGGLE_ECHO_PANEL') {
    echoPanel.toggle();
    sendResponse({ success: true });
  } else if (message.type === 'SAVE_SELECTED_TEXT') {
    echoPanel.openWithText(message.text);
    sendResponse({ success: true });
  }
  return true;
});
