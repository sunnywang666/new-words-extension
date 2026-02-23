function selectBestDefinition(data, contextSentence) {
  let allDefs = [];
  try {
    for (const entry of data) {
      for (const meaning of entry.meanings) {
        for (const def of meaning.definitions) {
          if (def.definition) {
            allDefs.push(def.definition);
          }
        }
      }
    }
  } catch (e) {}

  if (allDefs.length === 0) return "No definition available.";
  if (allDefs.length === 1 || !contextSentence) return allDefs[0];

  // --- LLM API CALL PLACEHOLDER ---
  // TODO: Replace this basic overlap algorithm with an LLM API call for perfect semantic matching.
  // Example: const bestDef = await callLLM(contextSentence, allDefs);
  // --------------------------------

  // Basic word-overlap algorithm
  const contextWords = new Set(contextSentence.toLowerCase().match(/\\b\\w+\\b/g) || []);
  let bestDef = allDefs[0];
  let maxOverlap = -1;

  for (const def of allDefs) {
    const defWords = def.toLowerCase().match(/\\b\\w+\\b/g) || [];
    let overlap = 0;
    for (const w of defWords) {
      // Ignore very common short words
      if (w.length > 3 && contextWords.has(w)) {
        overlap++;
      }
    }
    if (overlap > maxOverlap) {
      maxOverlap = overlap;
      bestDef = def;
    }
  }

  return bestDef;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchDefinition") {
    const word = request.word.toLowerCase();
    const contextSentence = request.contextSentence || "";
    const cacheKey = `def_${word}`;

    // Check cache first
    chrome.storage.local.get([cacheKey], (result) => {
      if (result[cacheKey]) {
        const data = result[cacheKey];
        const bestDef = selectBestDefinition(data, contextSentence);
        sendResponse({ success: true, data: data, bestDefinition: bestDef });
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
          const bestDef = selectBestDefinition(data, contextSentence);
          sendResponse({ success: true, data: data, bestDefinition: bestDef });
        })
        .catch(error => {
          clearTimeout(timeoutId);
          sendResponse({ success: false, error: error.message });
        });
    });

    return true; // Indicates we will send a response asynchronously
  }
});
