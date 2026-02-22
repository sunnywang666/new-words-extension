document.addEventListener('DOMContentLoaded', () => {
  // In preview mode, chrome might be injected slightly after DOMContentLoaded
  if (typeof chrome !== 'undefined' && chrome.storage) {
    loadVocab();
  }
  
  // Listen for messages from the parent window (for live preview updates)
  window.addEventListener('message', (e) => {
    if (e.data === 'chrome-injected' || e.data === 'vocab-updated') {
      loadVocab();
    }
  });
});

function loadVocab() {
  chrome.storage.local.get({ vocabList: [] }, (result) => {
    const vocabList = result.vocabList;
    const listContainer = document.getElementById('vocab-list');
    const countSpan = document.getElementById('word-count');
    
    countSpan.textContent = `${vocabList.length} words`;
    listContainer.innerHTML = '';
    
    if (vocabList.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-state">
          <div style="font-size: 24px;">ʕ´• ᴥ•̥\`ʔ</div>
          <div style="margin-top: 8px;">No words saved yet.</div>
        </div>
      `;
      return;
    }
    
    // Sort by timestamp descending (reverse chronological)
    vocabList.sort((a, b) => b.timestamp - a.timestamp);
    
    vocabList.forEach((item) => {
      const date = new Date(item.timestamp).toLocaleDateString(undefined, {
        month: 'short', day: 'numeric', year: 'numeric'
      });
      
      const itemEl = document.createElement('div');
      itemEl.className = 'vocab-item';
      itemEl.innerHTML = `
        <div class="vocab-item-header">
          <h3 class="vocab-word">${item.word}</h3>
          <span class="vocab-date">${date}</span>
        </div>
        <p class="vocab-def">${item.definition}</p>
        <div class="vocab-actions">
          <button class="delete-btn" data-word="${item.word}">Delete</button>
        </div>
      `;
      
      listContainer.appendChild(itemEl);
    });
    
    // Add delete listeners
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const wordToDelete = e.target.getAttribute('data-word');
        deleteWord(wordToDelete);
      });
    });
  });
}

function deleteWord(word) {
  chrome.storage.local.get({ vocabList: [] }, (result) => {
    const vocabList = result.vocabList.filter(item => item.word !== word);
    chrome.storage.local.set({ vocabList: vocabList }, () => {
      loadVocab();
    });
  });
}
