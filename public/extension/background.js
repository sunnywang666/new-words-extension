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

  // ============================================================================
  // TODO: Replace this heuristic word-overlap algorithm with an LLM API call 
  // (e.g., Gemini or OpenAI) for accurate semantic contextual matching.
  // ============================================================================

  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'and', 'or', 'but', 'not', 'it', 'this', 'that', 'these', 'those', 'as', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'can', 'could', 'should', 'from', 'about', 'which', 'who', 'whom', 'whose', 'what', 'where', 'when', 'why', 'how', 'i', 'you', 'he', 'she', 'we', 'they', 'me', 'him', 'her', 'us', 'them']);

  // Basic word-overlap algorithm
  const contextWords = (contextSentence.toLowerCase().match(/\b\w+\b/g) || [])
    .filter(w => !stopWords.has(w));
  const contextSet = new Set(contextWords);

  let bestDef = allDefs[0]; // Default to the most common (first) definition
  let maxOverlap = 0; // Start at 0. If no overlap > 0, we keep the first definition.

  for (const def of allDefs) {
    const defWords = (def.toLowerCase().match(/\b\w+\b/g) || [])
      .filter(w => !stopWords.has(w));
    
    let overlap = 0;
    for (const w of defWords) {
      if (contextSet.has(w)) {
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
