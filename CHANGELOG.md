# Changelog

## [1.7] - 2026-02-23
### Added
- **Contextual Auto-Selection**: The extension now automatically selects the most relevant dictionary definition based on the context sentence using a word-overlap algorithm.
- **Minimalist UI**: The tooltip has been simplified to only display the selected word, the best-fit definition, and a dynamic save button.
- **Nested Storage Schema**: The vocabulary book now groups saved sentences by their specific definition. If multiple sentences are saved for the same definition, only the newest is shown by default, with a "Show more" toggle for the rest.

## [1.6] - 2026-02-23
### Fixed
- **Sentence Extraction Bug**: Fixed an issue where selecting a word wrapped in inline formatting tags (like `<b>`, `<i>`, `<strong>`) would fail to capture the full surrounding sentence. The extension now traverses up the DOM tree to find the nearest block-level element to extract the complete sentence.
### Added
- **Context Sentence Highlighting**: The saved word is now underlined and highlighted within the context sentence in the vocabulary book popup.

## [1.5] - 2026-02-23
### Added
- **Context Sentence**: The extension now extracts and saves the original sentence where the word appeared. This context is displayed in the vocabulary book.
- **Save Count Tracking**: The extension now tracks how many times a word has been saved. If you save a word you've already saved before, its save count increments and it moves to the top of your list.

## [1.4] - 2026-02-23
### Performance
- **Definition Caching**: Implemented persistent caching of dictionary definitions using `chrome.storage.local` to significantly reduce loading times for previously looked-up words. Added a 5-second timeout to API requests to prevent infinite loading states.

## [1.3] - 2026-02-23
### Fixed
- **Extension Context Invalidated**: Fixed `Uncaught TypeError: Cannot read properties of undefined (reading 'getURL')` by checking if `chrome.runtime` exists before creating the tooltip.

## [1.2] - 2026-02-22
### Fixed
- **Vocabulary Book Saving**: Fixed an issue where words were not properly saved to `chrome.storage.local` and the vocabulary book displayed 0 words. Added fallback arrays and robust storage checks.
- **YouTube CC Support**: Fixed the Alt+Click interaction on YouTube subtitles. The extension now properly intercepts `mousedown`, `mouseup`, and `click` events in the capture phase to prevent the YouTube video from pausing when selecting a word.

## [1.1] - 2026-02-21
### Added
- **US American Pronunciation**: The extension now prioritizes US English audio pronunciation (`-us.mp3`) from the Free Dictionary API.
- **Vocabulary Book Storage & UI**: Added a popup UI accessible via the extension icon. It displays a list of saved words in reverse chronological order, reading from `chrome.storage.local`. Includes a delete function for each word.
- **YouTube Closed Captions (CC) Support**: Added a special interaction for YouTube. Users can now hold the `Alt` (or `Option`) key and click a word inside a YouTube subtitle (`.ytp-caption-segment`) to view its definition without pausing the video.
