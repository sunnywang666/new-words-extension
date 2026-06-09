document.addEventListener('DOMContentLoaded', () => {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    loadVocab();
  }

  window.addEventListener('message', (event) => {
    if (event.data === 'chrome-injected' || event.data === 'vocab-updated') {
      loadVocab();
    }
  });

  document.getElementById('export-btn')?.addEventListener('click', exportVocab);
  document.getElementById('import-btn')?.addEventListener('click', () => {
    document.getElementById('import-file')?.click();
  });
  document.getElementById('import-file')?.addEventListener('change', importVocab);
});

function loadVocab() {
  chrome.storage.local.get({ vocabList: [] }, (result) => {
    const vocabList = result.vocabList || [];
    const listContainer = document.getElementById('vocab-list');
    const countSpan = document.getElementById('word-count');

    if (!listContainer || !countSpan) return;

    countSpan.textContent = `${vocabList.length} words`;
    listContainer.innerHTML = '';

    if (vocabList.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-state">
          <div style="font-size: 24px;">Notebook ready</div>
          <div style="margin-top: 8px;">No words saved yet.</div>
        </div>
      `;
      return;
    }

    vocabList.sort((a, b) => {
      const getLatestTime = (item) => {
        if (item.timestamp) return item.timestamp;
        if (!item.entries) return 0;

        let max = 0;
        for (const entry of item.entries) {
          for (const sentence of entry.sentences) {
            if (sentence.timestamp > max) max = sentence.timestamp;
          }
        }
        return max;
      };

      return getLatestTime(b) - getLatestTime(a);
    });

    vocabList.forEach((item) => {
      if (!item.entries) {
        item.entries = [
          {
            definition: item.definition,
            sentences: [
              {
                text: item.context || '',
                timestamp: item.timestamp || Date.now(),
              },
            ],
          },
        ];
      }

      const totalSaves = item.entries.reduce((sum, entry) => sum + entry.sentences.length, 0);
      const saveCountHtml =
        totalSaves > 1 ? `<span class="vocab-count">Saved ${totalSaves}x</span>` : '';

      const itemEl = document.createElement('div');
      itemEl.className = 'vocab-item';

      let entriesHtml = '';
      item.entries.forEach((entry) => {
        const sortedSentences = [...entry.sentences].sort((a, b) => b.timestamp - a.timestamp);
        let sentencesHtml = '';

        if (sortedSentences.length > 0) {
          const firstSentence = sortedSentences[0];
          const highlightWord = firstSentence.originalWord || item.word;
          const escapedWord = highlightWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`\\b(${escapedWord}[a-z]*)\\b`, 'gi');
          const highlightedContext = firstSentence.text
            ? firstSentence.text.replace(regex, '<mark>$1</mark>')
            : '';

          if (highlightedContext) {
            sentencesHtml += `<div class="vocab-context">"${highlightedContext}"</div>`;
          }

          if (sortedSentences.length > 1) {
            let hiddenSentencesHtml = '';
            for (let i = 1; i < sortedSentences.length; i++) {
              const sentence = sortedSentences[i];
              const hiddenWord = sentence.originalWord || item.word;
              const hiddenEscaped = hiddenWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const hiddenRegex = new RegExp(`\\b(${hiddenEscaped}[a-z]*)\\b`, 'gi');
              const hiddenHighlighted = sentence.text
                ? sentence.text.replace(hiddenRegex, '<mark>$1</mark>')
                : '';

              if (hiddenHighlighted) {
                hiddenSentencesHtml += `<div class="vocab-context" style="margin-top: 4px;">"${hiddenHighlighted}"</div>`;
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

      let latestTime = 0;
      for (const entry of item.entries) {
        for (const sentence of entry.sentences) {
          if (sentence.timestamp > latestTime) latestTime = sentence.timestamp;
        }
      }

      const date = new Date(latestTime).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      itemEl.innerHTML = `
        <div class="vocab-item-header">
          <h3 class="vocab-word" data-audio="${item.audioUrl || ''}" ${item.audioUrl ? 'title="Click to play audio"' : ''}>${item.word}</h3>
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

    document.querySelectorAll('.vocab-word').forEach((wordEl) => {
      const audioUrl = wordEl.getAttribute('data-audio');
      if (!audioUrl) return;

      wordEl.style.cursor = 'pointer';
      wordEl.addEventListener('click', () => {
        const audio = new Audio(audioUrl);
        audio.play();
      });
    });

    document.querySelectorAll('.delete-btn').forEach((btn) => {
      btn.addEventListener('click', (event) => {
        const wordToDelete = event.target.getAttribute('data-word');
        deleteWord(wordToDelete);
      });
    });

    document.querySelectorAll('.vocab-show-more-btn').forEach((btn) => {
      btn.addEventListener('click', (event) => {
        const target = event.target;
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
    const vocabList = (result.vocabList || []).filter((item) => item.word !== word);
    chrome.storage.local.set({ vocabList }, () => {
      loadVocab();
    });
  });
}

function exportVocab() {
  chrome.storage.local.get({ vocabList: [] }, (result) => {
    const vocabList = result.vocabList || [];
    if (vocabList.length === 0) {
      alert('No words to export.');
      return;
    }

    const dataStr = JSON.stringify(vocabList, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    const date = new Date().toISOString().split('T')[0];
    link.download = `vocab-export-${date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });
}

function importVocab(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (loadEvent) => {
    try {
      const importedData = JSON.parse(loadEvent.target.result);
      if (!Array.isArray(importedData)) {
        throw new Error('Invalid format: Expected an array of words.');
      }

      const validData = importedData.filter((item) => item && item.word);
      if (validData.length === 0) {
        throw new Error('No valid words found in the file.');
      }

      chrome.storage.local.get({ vocabList: [] }, (result) => {
        const currentList = result.vocabList || [];

        validData.forEach((importedItem) => {
          const existingIndex = currentList.findIndex(
            (item) => item.word.toLowerCase() === importedItem.word.toLowerCase(),
          );

          if (existingIndex === -1) {
            currentList.push(importedItem);
            return;
          }

          const existingItem = currentList[existingIndex];
          if (!importedItem.entries) return;

          if (!existingItem.entries) existingItem.entries = [];

          importedItem.entries.forEach((importedEntry) => {
            const existingEntry = existingItem.entries.find(
              (entry) => entry.definition === importedEntry.definition,
            );

            if (!existingEntry) {
              existingItem.entries.push(importedEntry);
              return;
            }

            importedEntry.sentences.forEach((importedSentence) => {
              if (!existingEntry.sentences.find((sentence) => sentence.text === importedSentence.text)) {
                existingEntry.sentences.push(importedSentence);
              }
            });
          });
        });

        chrome.storage.local.set({ vocabList: currentList }, () => {
          loadVocab();
          alert(`Successfully imported ${validData.length} words!`);
        });
      });
    } catch (error) {
      alert(`Import failed: ${error.message}`);
    }

    event.target.value = '';
  };

  reader.readAsText(file);
}
