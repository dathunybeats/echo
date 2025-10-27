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
