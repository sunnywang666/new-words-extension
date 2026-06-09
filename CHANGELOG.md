# Changelog

## [2.3] - 2026-03-05
### Added
- **Import/Export Functionality**: You can now export your vocabulary list as a JSON file and import it back. This allows you to backup your data, sync across devices, or share your vocabulary list with others.

## [2.2] - 2026-02-23
### Added
- **Vocabulary Book Audio Interaction**: The minimalist audio interaction has been extended to the Vocabulary Book popup. You can now click the saved words in the popup to play their pronunciation, with the same hover effect as the tooltip.

## [2.1] - 2026-02-23
### Added
- **Lemmatization**: The extension now automatically sanitizes inflected words (e.g., "running", "cats") to their base form ("run", "cat") before querying the dictionary and saving. The vocabulary book groups words by their base form while preserving the original inflected word in the highlighted context sentence.
### Fixed
- **Duplicate Sentences**: Prevented the same example sentence from being saved multiple times under the same definition. Clicking "Save" on an already saved sentence now updates its timestamp instead of creating a duplicate.

## [1.10] - 2026-02-23
### Added
- **Minimalist Audio Interaction**: You can now click the word in the tooltip to play its pronunciation. The word text changes color on hover to indicate it is clickable, keeping the UI clean without a visible speaker icon.

## [1.9] - 2026-02-23
### Changed
- **Vocabulary Book UI Redesign**: Modernized the popup UI with a sophisticated highlight style (creamy off-white background with a subtle blue underscore), improved typography and visual hierarchy, softer card shadows, increased padding, and a subtler delete button.

## [1.8] - 2026-02-23
### Fixed
- **Sentence Extraction Bug**: Fixed an issue where the extension was grabbing truncated fragments instead of complete sentences. The extraction logic now uses a regular expression to extract the complete sentence containing the selected word from the closest block-level parent element.
- **Context Sentence Highlighting**: The saved word is now highlighted with a yellow background (`<mark>`) within the context sentence in the vocabulary book popup.
- **Auto-Selection Algorithm**: Enhanced the matching algorithm to remove common English stop words before comparing the context sentence with dictionary definitions. It now defaults to the most common Part of Speech (first entry) if the text-overlap score is too low or a tie.

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
