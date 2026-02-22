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

function removeTooltip() {
  if (tooltipHost) {
    tooltipHost.remove();
    tooltipHost = null;
  }
}

function createTooltip(word, rect) {
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
    for (let p of phonetics) {
      if (p.audio && p.audio !== "") {
        return p.audio;
      }
    }
    return null;
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
  saveBtn.addEventListener('click', () => {
    console.log("Saved Vocabulary Data:", fullData);
    
    // Success animation
    saveBtn.classList.add('vocab-saved');
    saveBtn.innerHTML = `ʕ´• ᴥ•̥\`ʔ Saved!`;
    
    setTimeout(() => {
      removeTooltip();
    }, 2000);
  });
}
