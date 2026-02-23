(function() {
  if (window.__vocabExtLoaded) return;
  window.__vocabExtLoaded = true;

  let tooltipHost = null;

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

  // Get bounding rect of selection to position the tooltip
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  // Create tooltip container
  createTooltip(selectedText, rect);
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
            createTooltip(word, rect || captionSegment.getBoundingClientRect());
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

function createTooltip(word, rect) {
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
  chrome.runtime.sendMessage({ action: "fetchDefinition", word: word }, (response) => {
    if (chrome.runtime.lastError || !response || !response.success) {
      container.innerHTML = `<div class="vocab-error">Definition not found.</div>`;
      return;
    }

    const data = response.data[0];
    const definition = getFirstDefinition(data);
    const audioUrl = getAudioUrl(data);

    renderTooltipContent(container, word, definition, audioUrl, data);
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

function renderTooltipContent(container, word, definition, audioUrl, fullData) {
  container.innerHTML = `
    <div class="vocab-header">
      <span class="vocab-word">${word}</span>
      ${audioUrl ? `<button class="vocab-audio-btn" title="Play Audio">
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        </svg>
      </button>` : ''}
    </div>
    <div class="vocab-def">${definition}</div>
    <div class="vocab-footer">
      <button class="vocab-save-btn">Save</button>
    </div>
  `;

  if (audioUrl) {
    const audioBtn = container.querySelector('.vocab-audio-btn');
    const audio = new Audio(audioUrl);
    audioBtn.addEventListener('click', () => {
      audio.play();
    });
  }

  const saveBtn = container.querySelector('.vocab-save-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      console.log("Saved Vocabulary Data:", fullData);
      
      const wordData = {
        word: word,
        definition: definition,
        timestamp: Date.now(),
        audioUrl: audioUrl
      };

      if (!chrome.storage || !chrome.storage.local) {
        console.error("Storage API not available. Please reload the extension.");
        saveBtn.innerHTML = `Error: No Storage`;
        return;
      }

      chrome.storage.local.get({ vocabList: [] }, (result) => {
        const vocabList = result.vocabList || [];
        // Check if already exists
        const exists = vocabList.find(item => item.word.toLowerCase() === word.toLowerCase());
        if (!exists) {
          vocabList.push(wordData);
          chrome.storage.local.set({ vocabList: vocabList }, () => {
            // Success animation
            saveBtn.classList.add('vocab-saved');
            saveBtn.innerHTML = `ʕ´• ᴥ•̥\`ʔ Saved!`;
            
            setTimeout(() => {
              removeTooltip();
            }, 2000);
          });
        } else {
          saveBtn.classList.add('vocab-saved');
          saveBtn.innerHTML = `Already Saved!`;
          setTimeout(() => {
            removeTooltip();
          }, 2000);
        }
      });
    });
  }
}
})();
