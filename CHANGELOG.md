# Changelog

## [1.1] - 2026-02-21
### Added
- **US American Pronunciation**: The extension now prioritizes US English audio pronunciation (`-us.mp3`) from the Free Dictionary API.
- **Vocabulary Book Storage & UI**: Added a popup UI accessible via the extension icon. It displays a list of saved words in reverse chronological order, reading from `chrome.storage.local`. Includes a delete function for each word.
- **YouTube Closed Captions (CC) Support**: Added a special interaction for YouTube. Users can now hold the `Alt` (or `Option`) key and click a word inside a YouTube subtitle (`.ytp-caption-segment`) to view its definition without pausing the video.
