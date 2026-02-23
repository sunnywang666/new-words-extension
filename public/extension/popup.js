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
    const vocabList = result.vocabList || [];
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
    
    // Sort words by most recently saved
    vocabList.sort((a, b) => {
      const getLatestTime = (item) => {
        if (item.timestamp) return item.timestamp; // legacy
        if (!item.entries) return 0;
        let max = 0;
        for (const entry of item.entries) {
          for (const s of entry.sentences) {
            if (s.timestamp > max) max = s.timestamp;
          }
        }
        return max;
      };
      return getLatestTime(b) - getLatestTime(a);
    });
    
    vocabList.forEach((item) => {
      // Migrate legacy format for display if needed
      if (!item.entries) {
        item.entries = [
          {
            definition: item.definition,
            sentences: [
              {
                text: item.context || "",
                timestamp: item.timestamp || Date.now()
              }
            ]
          }
        ];
      }

      const totalSaves = item.entries.reduce((sum, entry) => sum + entry.sentences.length, 0);
      const saveCountHtml = totalSaves > 1 ? `<span class="vocab-count">Saved ${totalSaves}x</span>` : '';
      
      const itemEl = document.createElement('div');
      itemEl.className = 'vocab-item';
      
      let entriesHtml = '';
      item.entries.forEach((entry, entryIndex) => {
        // Sort sentences by newest first
        const sortedSentences = [...entry.sentences].sort((a, b) => b.timestamp - a.timestamp);
        
        let sentencesHtml = '';
        if (sortedSentences.length > 0) {
          const firstSentence = sortedSentences[0];
          const regex = new RegExp(`\\b(${item.word})\\b`, 'gi');
          let highlightedContext = firstSentence.text ? firstSentence.text.replace(regex, '<span class="vocab-highlight">$1</span>') : '';
          
          if (highlightedContext) {
            sentencesHtml += `<div class="vocab-context">"${highlightedContext}"</div>`;
          }
          
          if (sortedSentences.length > 1) {
            let hiddenSentencesHtml = '';
            for (let i = 1; i < sortedSentences.length; i++) {
              const s = sortedSentences[i];
              const h = s.text ? s.text.replace(regex, '<span class="vocab-highlight">$1</span>') : '';
              if (h) {
                hiddenSentencesHtml += `<div class="vocab-context" style="margin-top: 4px;">"${h}"</div>`;
              }
            }
            
            if (hiddenSentencesHtml) {
              sentencesHtml += `
                <div class="vocab-more-sentences" style="display: none;">
                  ${hiddenSentencesHtml}
                </div>
                <button class="vocab-show-more-btn" style="background:none;border:none;color:#3b82f6;font-size:11px;cursor:pointer;padding:4px 8px;margin-top:4px;">Show more (${sortedSentences.length - 1})</button>
              `;
            }
          }
        }

        entriesHtml += `
          <div class="vocab-entry" style="margin-bottom: 8px;">
            <p class="vocab-def">${entry.definition}</p>
            ${sentencesHtml}
          </div>
        `;
      });

      // Get latest date for the header
      let latestTime = 0;
      for (const entry of item.entries) {
        for (const s of entry.sentences) {
          if (s.timestamp > latestTime) latestTime = s.timestamp;
        }
      }
      const date = new Date(latestTime).toLocaleDateString(undefined, {
        month: 'short', day: 'numeric', year: 'numeric'
      });

      itemEl.innerHTML = `
        <div class="vocab-item-header">
          <h3 class="vocab-word">${item.word}</h3>
          <div class="vocab-meta">
            ${saveCountHtml}
            <span class="vocab-date">${date}</span>
          </div>
        </div>
        <div class="vocab-entries">
          ${entriesHtml}
        </div>
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

    // Add show more listeners
    document.querySelectorAll('.vocab-show-more-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target;
        const moreDiv = target.previousElementSibling;
        if (moreDiv.style.display === 'none') {
          moreDiv.style.display = 'block';
          target.textContent = 'Show less';
        } else {
          moreDiv.style.display = 'none';
          target.textContent = `Show more (${moreDiv.children.length})`;
        }
      });
    });
  });
}

function deleteWord(word) {
  chrome.storage.local.get({ vocabList: [] }, (result) => {
    const vocabList = (result.vocabList || []).filter(item => item.word !== word);
    chrome.storage.local.set({ vocabList: vocabList }, () => {
      loadVocab();
    });
  });
}
