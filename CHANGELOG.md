# Changelog

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
