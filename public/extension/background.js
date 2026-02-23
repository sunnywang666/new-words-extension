chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchDefinition") {
    const word = request.word.toLowerCase();
    const cacheKey = `def_${word}`;

    // Check cache first
    chrome.storage.local.get([cacheKey], (result) => {
      if (result[cacheKey]) {
        sendResponse({ success: true, data: result[cacheKey] });
        return;
      }

      // If not in cache, fetch from API
      const apiUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      fetch(apiUrl, { signal: controller.signal })
        .then(response => {
          clearTimeout(timeoutId);
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then(data => {
          // Save to cache
          chrome.storage.local.set({ [cacheKey]: data });
          sendResponse({ success: true, data: data });
        })
        .catch(error => {
          clearTimeout(timeoutId);
          sendResponse({ success: false, error: error.message });
        });
    });

    return true; // Indicates we will send a response asynchronously
  }
});
