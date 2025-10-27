class EchoPanel {
  constructor() {
    this.isOpen = false;
    this.panel = null;
    this.init();
  }

  init() {
    // Create panel
    this.createPanel();

    // Setup event listeners
    this.setupListeners();
  }

  createPanel() {
    // Create panel container
    this.panel = document.createElement('div');
    this.panel.id = 'echo-panel';

    // Panel content
    this.panel.innerHTML = `
      <div class="echo-content">
        <div class="echo-inner">
          <div class="echo-flex-col">
            <div class="echo-text-container">
              <span class="echo-text">Hi World</span>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add to page
    document.body.appendChild(this.panel);
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
      if (this.isOpen && !this.panel.contains(e.target)) {
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
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
}

// Initialize
const echoPanel = new EchoPanel();

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'TOGGLE_ECHO_PANEL') {
    echoPanel.toggle();
    sendResponse({ success: true });
  }
  return true;
});
