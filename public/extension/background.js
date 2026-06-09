function lemmatize(word) {
  word = word.toLowerCase();
  
  const irregulars = {
    "is": "be", "are": "be", "was": "be", "were": "be", "am": "be",
    "has": "have", "had": "have", "does": "do", "did": "do",
    "went": "go", "gone": "go", "mice": "mouse", "men": "man", "women": "woman", "children": "child",
    "teeth": "tooth", "feet": "foot", "geese": "goose", "leaves": "leaf", "lives": "life",
    "halves": "half", "knives": "knife", "wives": "wife", "better": "good", "best": "good",
    "worse": "bad", "worst": "bad", "further": "far", "furthest": "far", "caught": "catch",
    "bought": "buy", "brought": "bring", "thought": "think", "fought": "fight", "taught": "teach",
    "slept": "sleep", "kept": "keep", "wept": "weep", "swept": "sweep", "felt": "feel",
    "left": "leave", "meant": "mean", "read": "read", "said": "say", "paid": "pay",
    "laid": "lay", "made": "make", "built": "build", "sent": "send", "spent": "spend",
    "lent": "lend", "lost": "lose", "shot": "shoot", "got": "get", "sat": "sit",
    "met": "meet", "led": "lead", "fed": "feed", "held": "hold", "told": "tell",
    "sold": "sell", "stood": "stand", "understood": "understand", "stuck": "stick",
    "struck": "strike", "won": "win", "spun": "spin", "dug": "dig", "swung": "swing",
    "hung": "hang", "slung": "sling", "wrung": "wring", "stung": "sting", "flung": "fling",
    "clung": "cling", "came": "come", "became": "become", "ran": "run", "swam": "swim",
    "began": "begin", "drank": "drink", "rang": "ring", "sang": "sing", "sank": "sink",
    "stank": "stink", "saw": "see", "flew": "fly", "grew": "grow", "knew": "know",
    "threw": "throw", "blew": "blow", "drew": "draw", "showed": "show", "took": "take",
    "shook": "shake", "forsook": "forsake", "mistook": "mistake", "drove": "drive",
    "rode": "ride", "wrote": "write", "rose": "rise", "stole": "steal", "chose": "choose",
    "froze": "freeze", "spoke": "speak", "awoke": "awake", "broke": "break", "tore": "tear",
    "wore": "wear", "swore": "swear", "bore": "bear", "bit": "bite", "hid": "hide",
    "fell": "fall", "ate": "eat", "gave": "give", "forgave": "forgive", "forgot": "forget"
  };

  if (irregulars[word]) return irregulars[word];

  if (word.endsWith('ies') && word.length > 4) return word.slice(0, -3) + 'y';
  if (word.endsWith('ves') && word.length > 4) return word.slice(0, -3) + 'f';
  if (word.endsWith('oes') && word.length > 4) return word.slice(0, -2);
  if ((word.endsWith('sses') || word.endsWith('shes') || word.endsWith('ches') || word.endsWith('xes') || word.endsWith('zzes')) && word.length > 4) {
    return word.slice(0, -2);
  }
  if (word.endsWith('s') && word.length > 3 && !word.endsWith('ss') && !word.endsWith('us') && !word.endsWith('is')) {
    return word.slice(0, -1);
  }
  
  if (word.endsWith('ing') && word.length > 4) {
    let base = word.slice(0, -3);
    if (base.match(/([^aeiou])\1$/)) return base.slice(0, -1);
    if (base.match(/[aeiou][^aeiou]$/)) return base + 'e';
    return base;
  }
  
  if (word.endsWith('ed') && word.length > 3) {
    let base = word.slice(0, -2);
    if (base.match(/([^aeiou])\1$/)) return base.slice(0, -1);
    if (base.endsWith('i')) return base.slice(0, -1) + 'y';
    if (base.match(/[aeiou][^aeiou]$/)) return base + 'e';
    return base;
  }

  return word;
}

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
    const originalWord = request.word.toLowerCase();
    const baseWord = lemmatize(originalWord);
    const contextSentence = request.contextSentence || "";
    const cacheKey = `def_${baseWord}`;

    // Check cache first
    chrome.storage.local.get([cacheKey], (result) => {
      if (result[cacheKey]) {
        const data = result[cacheKey];
        const finalWord = data[0].word || baseWord;
        const bestDef = selectBestDefinition(data, contextSentence);
        sendResponse({ success: true, data: data, bestDefinition: bestDef, baseWord: finalWord, originalWord: originalWord });
        return;
      }

      // If not in cache, fetch from API
      const apiUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(baseWord)}`;
      
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
          const finalWord = data[0].word || baseWord;
          const bestDef = selectBestDefinition(data, contextSentence);
          sendResponse({ success: true, data: data, bestDefinition: bestDef, baseWord: finalWord, originalWord: originalWord });
        })
        .catch(error => {
          clearTimeout(timeoutId);
          sendResponse({ success: false, error: error.message });
        });
    });

    return true; // Indicates we will send a response asynchronously
  }
});
