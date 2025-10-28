# ChakWrite AI Writing Assistant

**Neuro-inclusive AI-powered writing assistant for Chrome** 🧠✨

Privacy-first Chrome extension designed specifically for neurodivergent users, featuring specialized modes for dyslexia, ADHD, and autism. Powered by Chrome's built-in AI APIs — all processing happens locally on your device.

## ✨ Key Features

### 🎯 Neuro-Inclusive Modes
- **Dyslexia-Friendly Writing** — Short sentences, simple words, clear structure, OpenDyslexic font
- **ADHD Focus Mode** — Bullet points, key highlights, scannable content
- **Clear & Direct Communication** — Literal language, no metaphors, concrete examples

### 🎨 Floating Overlay System
- **Smart text selection** — Select any text to see writing assistance options
- **Glassmorphism UI** — Modern, semi-transparent design with blur effects
- **3 Quick Actions**: Simplify, Expand, Check Grammar
- **Auto-positioning** — Appears near selection without blocking content
- **Keyboard navigation** — Full arrow key + Escape support

### 🔒 Privacy & Performance
- **100% Client-Side** — All AI processing runs locally via Chrome Built-in APIs
- **No Data Transmission** — Your text never leaves your device
- **No Server Required** — Works completely offline when APIs are available
- **Open Source** — Apache 2.0 License

## 🏗️ Project Structure

```
ChakWrite_Chrome_AI/
├── src/
│   ├── scripts/
│   │   ├── background.js      # Service worker
│   │   ├── overlay.js         # Floating panel system
│   │   ├── modes.js           # Neuro mode processors (dyslexia, ADHD, autism)
│   │   ├── app.js             # Main application logic
│   │   ├── writer.js          # Writer API wrapper
│   │   ├── rewriter.js        # Rewriter API wrapper
│   │   ├── summarizer.js      # Summarizer API wrapper
│   │   ├── proofreader.js     # Proofreader API wrapper
│   │   └── prompt.js          # Prompt API wrapper
│   └── ui/
│       ├── popup/             # Extension popup (mode selection)
│       │   ├── index.html
│       │   ├── popup.js
│       │   └── styles.css
│       └── main/              # Main page
│           ├── index.html
│           └── styles.css
├── styles/
│   ├── overlay.css            # Glassmorphism overlay styles
│   └── content.css            # Content script + dyslexia font styles
├── fonts/
│   └── OpenDyslexic-Regular.otf
├── icons/
│   ├── icon16.png             # 16x16 toolbar icon
│   ├── icon16b.png            # 16x16 alternate icon
│   ├── icon48.png             # 48x48 extension icon
│   ├── icon48b.png            # 48x48 alternate icon
│   ├── icon128.png            # 128x128 Chrome Web Store icon
│   └── icon128b.png           # 128x128 alternate icon
├── manifest.json              # Chrome Extension Manifest v3
├── README.md                  # Main documentation
├── README_NEURO_MODES.md      # Detailed mode specifications
├── DEBUG_FIXES_SUMMARY.md     # UI fixes and debugging guide
├── LICENSE                    # Apache 2.0 License
├── .gitignore                 # Git ignore rules
└── package-lock.json          # Package lock file
```

## 🚀 Installation

### Method 1: Load Unpacked (Development)
1. Open `chrome://extensions` in Chrome
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `ChakWrite_Chrome_AI` folder
5. Extension icon should appear in toolbar

### Method 2: Chrome Web Store
*Coming soon*

## 📖 Usage

### 1. Select Your Mode
- Click the ChakWrite extension icon
- Choose your neurotype mode:
  - 🔵 Dyslexia-Friendly
  - 🟣 ADHD Focus
  - 🟢 Clear & Direct (Autism)
- Mode saves automatically

### 2. Use the Overlay
- **Select text** on any webpage
- **Floating panel appears** near your selection
- **Click an action**:
  - ✨ **Simplify** — Makes text easier to read (mode-specific)
  - 📝 **Expand** — Adds details/structure (mode-specific)
  - ✓ **Check** — Grammar and spelling correction
- Text is **automatically replaced** in the page

### 3. Keyboard Shortcuts
- **Arrow Left/Right** — Navigate between buttons
- **Escape** — Hide overlay
- **Tab** — Focus next button

## 🧠 How Each Mode Works

### Dyslexia-Friendly Writing (Blue)
**APIs Used**: Rewriter + Writer + Language Model
- **Simplify**: Breaks long sentences, uses common words
- **Expand**: Adds context with simple language
- **Visual**: OpenDyslexic font with increased spacing

### ADHD Focus Mode (Purple)
**APIs Used**: Summarizer + Writer + Language Model
- **Simplify**: Converts to bullet points, extracts key info
- **Expand**: Adds structure with transitions between ideas
- **Visual**: Scannable, organized content

### Clear & Direct Communication (Green)
**APIs Used**: Rewriter + Proofreader + Language Model
- **Simplify**: Removes metaphors, makes literal
- **Expand**: Provides concrete details and examples
- **Visual**: Direct, unambiguous language

## 🎨 Design Philosophy

### Neuro-Inclusive Design Principles
- ✅ **No bright backgrounds** — Avoids overwhelming ADHD users
- ✅ **Subtle border glows** — Clear state indication without visual noise
- ✅ **High contrast** — Maintains accessibility
- ✅ **Smooth transitions** — Reduces jarring changes (0.3s ease)
- ✅ **Professional aesthetic** — Calm, focused, reduces cognitive load

### Accessibility Features
- ✅ ARIA labels for screen readers
- ✅ Keyboard navigation support
- ✅ Focus-visible outlines
- ✅ High contrast mode support
- ✅ Reduced motion support
- ✅ Color-blind friendly accents

## 🛠️ Technical Details

### Chrome AI APIs Used
- **Rewriter API** — Text simplification, tone adjustment
- **Writer API** — Content generation with context
- **Summarizer API** — Key point extraction
- **Proofreader API** — Grammar and spelling correction (planned)
- **Language Model** — General-purpose text processing

### Requirements
- Chrome 127+ (for Chrome Built-in AI APIs)
- APIs may need to be enabled in `chrome://flags` depending on your Chrome version

### Permissions Explained
- `activeTab` — Access current page content for text replacement
- `storage` — Save mode preferences
- `scripting` — Inject content scripts for overlay
- `tabs` — Communicate with active tabs

## 🐛 Known Limitations

- Chrome AI APIs availability varies by region and Chrome version
- Some websites may block content script injection (e.g., Chrome Web Store pages)
- APIs require user interaction before download
- Fallback mode provides basic functionality when APIs unavailable

## 📝 Development

### Testing Modes
```javascript
// Change mode programmatically
chrome.storage.local.set({ activeMode: 'adhd' });

// Check current mode
chrome.storage.local.get(['activeMode'], console.log);
```

### Debug Overlay
```javascript
// Show overlay manually
document.querySelector('.chakwrite-overlay').classList.add('visible');

// Check overlay state
let overlay = document.querySelector('.chakwrite-overlay');
console.log('Display:', window.getComputedStyle(overlay).display);
console.log('Z-index:', window.getComputedStyle(overlay).zIndex);
```

## 📚 Additional Documentation

- **[README_NEURO_MODES.md](README_NEURO_MODES.md)** — Detailed mode specifications
- **[DEBUG_FIXES_SUMMARY.md](DEBUG_FIXES_SUMMARY.md)** — UI fixes and debugging guide
- **[LICENSE](LICENSE)** — Apache 2.0 License

## 🤝 Contributing

Contributions that improve accessibility for neurodivergent users are especially welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

Apache License 2.0 — See [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- **OpenDyslexic Font** — Created by Abelardo Gonzalez
- **Chrome AI Team** — For built-in AI APIs
- **Neurodivergent Community** — For feedback and inspiration

---

**Made with ❤️ for the neurodivergent community**

*Version 1.2 • Last Updated: October 2025*
