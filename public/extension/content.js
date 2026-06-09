(function() {
  if (window.__vocabExtLoaded) return;
  window.__vocabExtLoaded = true;

  let tooltipHost = null;

  // Helper to extract context sentence
  function getContextSentence(word, text) {
    if (!text) return "";
    text = text.replace(/\s+/g, ' ').trim();
    
    // Split text into sentences using regex matching common sentence boundaries
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    // Find the first sentence that contains the word
    const wordRegex = new RegExp(`\\b${word}\\b`, 'i');
    for (const sentence of sentences) {
      if (wordRegex.test(sentence)) {
        return sentence.trim();
      }
    }
    
    // Fallback if exact word boundary not found but substring exists
    for (const sentence of sentences) {
      if (sentence.toLowerCase().includes(word.toLowerCase())) {
        return sentence.trim();
      }
    }
    
    // Ultimate fallback
    return text.length > 120 ? text.substring(0, 120) + "..." : text;
  }

  document.addEventListener('mouseup', (event) => {
  // Don't trigger if clicking inside our own tooltip
  if (tooltipHost && tooltipHost.contains(event.target)) {
    return;
  }

  // Remove existing tooltip
  removeTooltip();

  // Get selected text
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  // Check if it's a single English word (letters only, maybe a hyphen)
  if (!selectedText || !/^[a-zA-Z\-]+$/.test(selectedText)) {
    return;
  }

  let fullText = "";
  if (selection.anchorNode) {
    let node = selection.anchorNode;
    if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;
    
    // Traverse up to find a block-level element
    const blockElements = ['P', 'DIV', 'ARTICLE', 'SECTION', 'LI', 'BLOCKQUOTE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'TD', 'TH'];
    while (node && node.parentElement && !blockElements.includes(node.tagName.toUpperCase())) {
      node = node.parentElement;
    }
    
    fullText = node.innerText || node.textContent || "";
  }
  const contextSentence = getContextSentence(selectedText, fullText);

  // Get bounding rect of selection to position the tooltip
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  // Create tooltip container
  createTooltip(selectedText, rect, contextSentence);
});

document.addEventListener('mousedown', (event) => {
  if (tooltipHost && !tooltipHost.contains(event.target)) {
    removeTooltip();
  }
});

  // YouTube CC Support (intercept mousedown, mouseup, click)
  function handleYouTubeCaptionEvent(e) {
    // In preview mode, we might not be on youtube.com, so we check for the class instead
    const isYouTube = window.location.hostname.includes('youtube.com') || document.querySelector('.ytp-caption-segment');
    if (!isYouTube) return;

    const target = e.target;
    if (target && target.closest) {
      const captionSegment = target.closest('.ytp-caption-segment');
      if (captionSegment && e.altKey) {
        e.preventDefault();
        e.stopPropagation();
        
        if (e.type === 'mouseup') {
          let word = "";
          let rect = null;
          
          let textNode = null;
          let offset = 0;

          if (document.caretRangeFromPoint) {
            const range = document.caretRangeFromPoint(e.clientX, e.clientY);
            if (range) {
              textNode = range.startContainer;
              offset = range.startOffset;
            }
          } else if (document.caretPositionFromPoint) {
            const pos = document.caretPositionFromPoint(e.clientX, e.clientY);
            if (pos) {
              textNode = pos.offsetNode;
              offset = pos.offset;
            }
          }
          
          // If we clicked an element instead of a text node, try to get its first text node child
          if (textNode && textNode.nodeType !== Node.TEXT_NODE) {
            // Just a fallback, might not be perfectly accurate for offset
            if (textNode.childNodes.length > 0 && textNode.childNodes[0].nodeType === Node.TEXT_NODE) {
              textNode = textNode.childNodes[0];
              offset = 0; // fallback offset
            }
          }

          if (textNode && textNode.nodeType === Node.TEXT_NODE) {
            const text = textNode.textContent || "";
            
            // Find word boundaries
            let start = offset;
            while (start > 0 && /[a-zA-Z\-]/.test(text[start - 1])) {
              start--;
            }
            let end = offset;
            while (end < text.length && /[a-zA-Z\-]/.test(text[end])) {
              end++;
            }
            
            word = text.substring(start, end).trim();
            if (word && /^[a-zA-Z\-]+$/.test(word)) {
              const wordRange = document.createRange();
              try {
                wordRange.setStart(textNode, start);
                wordRange.setEnd(textNode, end);
                rect = wordRange.getBoundingClientRect();
              } catch (err) {
                console.error("Range error", err);
              }
            }
          }
          
          // Fallback if caret extraction failed but we have a word from selection or innerText
          if (!word) {
            const selText = window.getSelection().toString().trim();
            if (selText && /^[a-zA-Z\-]+$/.test(selText)) {
              word = selText;
            } else {
              // Last resort: just take the whole segment text if it's a single word
              const segmentText = captionSegment.textContent.trim();
              if (/^[a-zA-Z\-]+$/.test(segmentText)) {
                word = segmentText;
              }
            }
          }
          
          if (word) {
            removeTooltip();
            let fullText = captionSegment ? (captionSegment.innerText || captionSegment.textContent || "") : "";
            const contextSentence = getContextSentence(word, fullText);
            createTooltip(word, rect || captionSegment.getBoundingClientRect(), contextSentence);
          }
        }
      }
    }
  }

  document.addEventListener('mousedown', handleYouTubeCaptionEvent, true);
  document.addEventListener('mouseup', handleYouTubeCaptionEvent, true);
  document.addEventListener('click', handleYouTubeCaptionEvent, true);

function removeTooltip() {
  if (tooltipHost) {
    tooltipHost.remove();
    tooltipHost = null;
  }
}

function createTooltip(word, rect, contextSentence = "") {
  if (!chrome || !chrome.runtime || !chrome.runtime.getURL) {
    console.warn("Extension context invalidated. Please refresh the page.");
    return;
  }

  tooltipHost = document.createElement('div');
  tooltipHost.id = 'vocab-ext-host';
  
  // Use Shadow DOM for style isolation
  const shadowRoot = tooltipHost.attachShadow({ mode: 'open' });
  
  // Inject styles into Shadow DOM
  const styleLink = document.createElement('link');
  styleLink.rel = 'stylesheet';
  styleLink.href = chrome.runtime.getURL('styles.css');
  shadowRoot.appendChild(styleLink);

  const container = document.createElement('div');
  container.className = 'vocab-tooltip';
  
  // Position the tooltip above the selection
  tooltipHost.style.position = 'absolute';
  tooltipHost.style.left = `${rect.left + window.scrollX + rect.width / 2}px`;
  tooltipHost.style.top = `${rect.top + window.scrollY - 10}px`;
  tooltipHost.style.zIndex = '2147483647'; // Max z-index
  
  container.innerHTML = `
    <div class="vocab-loading">
      <div class="vocab-spinner"></div>
      <span>Fetching...</span>
    </div>
  `;
  
  shadowRoot.appendChild(container);
  document.body.appendChild(tooltipHost);

  // Fetch definition
  chrome.runtime.sendMessage({ action: "fetchDefinition", word: word, contextSentence: contextSentence }, (response) => {
    if (chrome.runtime.lastError || !response || !response.success) {
      container.innerHTML = `<div class="vocab-error">Definition not found.</div>`;
      return;
    }

    const data = response.data[0];
    const definition = response.bestDefinition || getFirstDefinition(data);
    const audioUrl = getAudioUrl(data);
    const baseWord = response.baseWord || word;
    const originalWord = response.originalWord || word;

    // Query storage for save count
    chrome.storage.local.get({ vocabList: [] }, (result) => {
      const vocabList = result.vocabList || [];
      const existingWordEntry = vocabList.find(item => item.word.toLowerCase() === baseWord.toLowerCase());
      
      let saveCount = 0;
      if (existingWordEntry && existingWordEntry.entries) {
        saveCount = existingWordEntry.entries.reduce((sum, entry) => sum + (entry.sentences ? entry.sentences.length : 0), 0);
      } else if (existingWordEntry) {
        // Legacy format
        saveCount = existingWordEntry.saveCount || 1;
      }

      renderTooltipContent(container, baseWord, originalWord, definition, contextSentence, saveCount, audioUrl);
    });
  });
}

function getFirstDefinition(data) {
  try {
    // Find the first valid definition
    for (const meaning of data.meanings) {
      for (const def of meaning.definitions) {
        if (def.definition) return def.definition;
      }
    }
    return "No definition available.";
  } catch (e) {
    return "No definition available.";
  }
}

function getAudioUrl(data) {
  try {
    const phonetics = data.phonetics;
    let usAudio = null;
    let anyAudio = null;
    
    for (let p of phonetics) {
      if (p.audio && p.audio !== "") {
        if (!anyAudio) anyAudio = p.audio;
        if (p.audio.includes('-us.mp3') || (p.text && p.text.includes('US'))) {
          usAudio = p.audio;
        }
      }
    }
    return usAudio || anyAudio;
  } catch (e) {
    return null;
  }
}

function renderTooltipContent(container, baseWord, originalWord, definition, contextSentence, saveCount, audioUrl) {
  const saveText = saveCount > 0 ? `Save (${saveCount})` : `Save`;

  container.innerHTML = `
    <div class="vocab-header">
      <span class="vocab-word" ${audioUrl ? 'title="Click to play audio"' : ''}>${baseWord}</span>
    </div>
    <div class="vocab-def">${definition}</div>
    <div class="vocab-footer">
      <button class="vocab-save-btn">${saveText}</button>
    </div>
  `;

  if (audioUrl) {
    const wordEl = container.querySelector('.vocab-word');
    const audio = new Audio(audioUrl);
    wordEl.addEventListener('click', () => {
      audio.play();
    });
  }

  const saveBtn = container.querySelector('.vocab-save-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      if (!chrome.storage || !chrome.storage.local) {
        console.error("Storage API not available. Please reload the extension.");
        saveBtn.innerHTML = `Error: No Storage`;
        return;
      }

      chrome.storage.local.get({ vocabList: [] }, (result) => {
        let vocabList = result.vocabList || [];
        
        // Find existing word
        let existingIndex = vocabList.findIndex(item => item.word.toLowerCase() === baseWord.toLowerCase());
        
        const newSentence = {
          text: contextSentence,
          timestamp: Date.now(),
          originalWord: originalWord
        };

        if (existingIndex === -1) {
          // New word
          vocabList.push({
            word: baseWord,
            audioUrl: audioUrl,
            entries: [
              {
                definition: definition,
                sentences: [newSentence]
              }
            ]
          });
          existingIndex = vocabList.length - 1;
        } else {
          // Existing word
          let wordItem = vocabList[existingIndex];
          if (audioUrl && !wordItem.audioUrl) {
            wordItem.audioUrl = audioUrl;
          }
          
          // Migrate legacy format if needed
          if (!wordItem.entries) {
            wordItem.entries = [
              {
                definition: wordItem.definition,
                sentences: [
                  {
                    text: wordItem.context || "",
                    timestamp: wordItem.timestamp || Date.now(),
                    originalWord: wordItem.word
                  }
                ]
              }
            ];
            delete wordItem.definition;
            delete wordItem.context;
            delete wordItem.timestamp;
            delete wordItem.audioUrl;
            delete wordItem.saveCount;
          }
          
          // Find matching definition
          let defEntry = wordItem.entries.find(e => e.definition === definition);
          if (defEntry) {
            // Prevent duplicate sentences
            const existingSentence = defEntry.sentences.find(s => s.text === contextSentence);
            if (existingSentence) {
              existingSentence.timestamp = Date.now(); // Update timestamp
            } else {
              defEntry.sentences.push(newSentence);
            }
          } else {
            wordItem.entries.push({
              definition: definition,
              sentences: [newSentence]
            });
          }
        }

        chrome.storage.local.set({ vocabList: vocabList }, () => {
          // Calculate new total save count
          const wordItem = vocabList[existingIndex];
          const totalSaves = wordItem.entries.reduce((sum, entry) => sum + entry.sentences.length, 0);
          
          saveBtn.classList.add('vocab-saved');
          saveBtn.innerHTML = `Saved (${totalSaves})!`;
          
          setTimeout(() => {
            removeTooltip();
          }, 2000);
        });
      });
    });
  }
}
})();
