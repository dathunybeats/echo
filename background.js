// Create context menu on extension install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'askChatGPT',
    title: 'Ask ChatGPT',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'saveToEcho',
    title: 'Save to Echo',
    contexts: ['selection']
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'askChatGPT' && info.selectionText) {
    const selectedText = info.selectionText;
    const chatGPTUrl = `https://chatgpt.com/?q=${encodeURIComponent(selectedText)}`;

    // Open ChatGPT in new tab
    chrome.tabs.create({ url: chatGPTUrl });
  } else if (info.menuItemId === 'saveToEcho' && info.selectionText) {
    // Send message to content script to open panel with selected text
    chrome.tabs.sendMessage(tab.id, {
      type: 'SAVE_SELECTED_TEXT',
      text: info.selectionText
    });
  }
});

// Toggle panel when extension icon is clicked
chrome.action.onClicked.addListener(async (tab) => {
  try {
    await chrome.tabs.sendMessage(tab.id, {
      type: 'TOGGLE_ECHO_PANEL'
    });
  } catch (error) {
    // Content script not loaded yet, inject it
    console.log('Injecting content script...');
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content-script.js']
      });

      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['styles.css']
      });

      // Wait a bit for script to initialize
      setTimeout(async () => {
        try {
          await chrome.tabs.sendMessage(tab.id, {
            type: 'TOGGLE_ECHO_PANEL'
          });
        } catch (e) {
          console.error('Failed to toggle panel:', e);
        }
      }, 100);
    } catch (e) {
      console.error('Failed to inject content script:', e);
    }
  }
});
