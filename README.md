# ChakWrite AI Writing Assistant (Chrome MV3)

AI-powered, privacy-first writing assistant with neuro-inclusive adaptations. Works on any website using Chrome's built-in AI APIs via an offscreen document.

Features
- Smart writing: Write, Rewrite, Summarize, Proofread, Autocomplete
- Neuro-inclusive modes: Dyslexia, ADHD, Autism (prompt engineering + post-formatting)
- Floating overlay on selection with glassmorphism UI
- Popup dashboard with voice input and mode switcher
- Visual adaptations: dyslexia-friendly font, spacing, high-contrast
- OCR: On-device TextDetector; lazy Tesseract fallback (offline-ready if assets included)
- Keyboard shortcuts: Alt+Shift+R (Rewrite), Alt+Shift+P (Proofread)

Install (unpacked)
1. Open chrome://extensions, enable Developer mode.
2. Load unpacked → select this folder.

Usage
- Select text on any page → overlay actions appear.
- Popup: type or use mic, choose mode, Execute.
- Options: set Neuro mode, font, spacing, OCR, real-time proofreader, autocomplete on Tab.

Offline and Privacy
- AI runs client-side via Chrome AI APIs when available.
- OCR uses on-device TextDetector if supported.
- Optional Tesseract.js fallback can be fully offline if you bundle assets locally.

Optional OCR assets (for fallback)
- Place the following in the extension directory:
  - vendor/tesseract.min.js
  - vendor/worker.min.js
  - vendor/tesseract-core.wasm.js
  - models/eng.traineddata
- Ensure these paths exist; the extension is preconfigured to load them.

Development notes
- Offscreen document hosts window.ai usage; background mediates requests with timeouts.
- Content script handles overlay UI, replacements in inputs/contenteditable, and accessibility hooks.
- Styling follows glassmorphism with high-contrast option; keyboard focus uses focus-visible.

Permissions
- storage, activeTab, scripting, offscreen

Known limitations
- If Chrome AI APIs are unavailable, features gracefully degrade.
- Tesseract fallback requires assets to be added manually to keep repo size small.
