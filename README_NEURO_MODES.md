# ChakWrite AI - Neuro-Inclusive Writing Assistant

## 🎯 Overview
ChakWrite is a privacy-first Chrome extension that provides AI-powered writing assistance specifically designed for neurodivergent users, featuring specialized modes for dyslexia, ADHD, and autism.

## ✨ Key Features

### 📝 Floating Overlay System
- **Glassmorphism Design**: Semi-transparent panel with blur(20px) backdrop
- **Smart Positioning**: Appears near selected text without blocking content
- **Auto-hide**: Disappears after 3 seconds of inactivity
- **Keyboard Navigation**: Full arrow key + Escape support
- **Accessibility**: ARIA labels, high contrast mode support

### 🧠 Neuro-Inclusive Modes

#### 1. **Dyslexia-Friendly Writing** (Blue gradient icon)
- **Font**: OpenDyslexic with increased spacing
- **APIs**: Rewriter + Writer
- **Features**:
  - Breaks long sentences into shorter ones
  - Replaces complex words with simpler alternatives
  - Adds clear structure to text
  - Applies dyslexia-friendly typography

#### 2. **ADHD Focus Mode** (Purple gradient icon)
- **APIs**: Summarizer + Writer  
- **Features**:
  - Converts text into bullet points
  - Highlights key information
  - Adds transitions between ideas
  - Creates scannable structure

#### 3. **Clear & Direct Communication** (Green gradient icon)
- **APIs**: Rewriter + Proofreader
- **Features**:
  - Removes metaphors and idioms
  - Uses literal, concrete language
  - Provides specific examples
  - Eliminates ambiguous phrases

## 🎨 Overlay Actions

### ✨ Simplify
- Dyslexia: Breaks into short sentences, common words
- ADHD: Converts to bullet points
- Autism: Removes metaphors, makes literal

### 📝 Expand
- Dyslexia: Adds context with simple language
- ADHD: Adds structure with transitions
- Autism: Provides concrete details/examples

### ✓ Check Grammar
- All modes: Uses Proofreader API for corrections

## 🏗️ Project Structure

```
ChakWrite_Chrome_AI/
├── src/
│   ├── scripts/
│   │   ├── overlay.js          # Floating panel system (standalone)
│   │   ├── background.js       # Service worker
│   │   ├── modes/
│   │   │   ├── dyslexia.js    # Dyslexia mode processor
│   │   │   ├── adhd.js        # ADHD mode processor
│   │   │   └── autism.js      # Autism mode processor
│   │   ├── prompt.js          # Prompt API integration
│   │   ├── writer.js          # Writer API
│   │   ├── rewriter.js        # Rewriter API
│   │   ├── proofreader.js     # Proofreader API
│   │   └── summarizer.js      # Summarizer API
│   └── ui/
│       ├── popup/
│       │   ├── index.html     # Popup with mode buttons
│       │   └── styles.css     # Popup styles
│       └── main/
│           ├── index.html     # Main page
│           └── styles.css     # Main styles
├── styles/
│   ├── overlay.css            # Glassmorphism overlay styles
│   └── content.css            # Content script styles + dyslexia font
├── fonts/
│   └── OpenDyslexic-Regular.otf
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── manifest.json              # Extension manifest v3
```

## 🚀 Installation

1. **Load Extension**:
   - Open `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select `ChakWrite_Chrome_AI` folder

2. **Select Mode**:
   - Click extension icon
   - Choose your neurotype mode (Dyslexia/ADHD/Autism)
   - Mode saves automatically

3. **Use Overlay**:
   - Select text on any webpage
   - Floating panel appears near selection
   - Click Simplify/Expand/Check Grammar
   - Text is replaced automatically

## 🎯 Keyboard Shortcuts

- **Arrow Left/Right**: Navigate between overlay buttons
- **Escape**: Hide overlay
- **Tab**: Focus next button

## 🔒 Privacy & Performance

- **Client-Side Processing**: All AI runs locally via Chrome Built-in APIs
- **No Data Transmission**: Text never leaves your device
- **On-Demand Loading**: APIs load only when needed
- **Graceful Fallback**: Works without API availability

## 🧪 Chrome AI APIs Used

- **Rewriter API**: Text simplification, tone adjustment
- **Writer API**: Content generation with context
- **Summarizer API**: Key point extraction
- **Proofreader API**: Grammar and spelling correction
- **Prompt API**: General-purpose assistance

## 🎨 Design System

### Colors
- **Dyslexia**: Blue gradient (#4facfe → #00f2fe)
- **ADHD**: Purple gradient (#a855f7 → #7c3aed)
- **Autism**: Green gradient (#22c55e → #16a34a)

### Typography
- **Default**: System fonts (Inter, SF Pro, Segoe UI)
- **Dyslexia Mode**: OpenDyslexic with 1.8 line-height

### Glassmorphism
- Background: `rgba(26, 26, 26, 0.9)`
- Backdrop filter: `blur(20px) saturate(150%)`
- Border: `1px solid rgba(255, 255, 255, 0.1)`

## 🛠️ Development

### Testing Modes
```javascript
// Change mode in popup
chrome.storage.local.set({ activeMode: 'adhd' });

// Check current mode
chrome.storage.local.get(['activeMode'], console.log);
```

### Debug Overlay
```javascript
// Show overlay manually
document.querySelector('.chakwrite-overlay').classList.add('visible');

// Check mode processor
chrome.runtime.sendMessage({
  action: 'getModeInfo',
  mode: 'dyslexia'
}, console.log);
```

## 📋 Permissions Explained

- **activeTab**: Access current page content
- **storage**: Save mode preferences
- **scripting**: Inject content scripts
- **<all_urls>**: Work on all websites

## 🐛 Known Limitations

- Chrome AI APIs may not be available in all regions
- Overlay requires user interaction before API download
- Some websites may block content script injection
- Font loading depends on extension permissions

## 🤝 Contributing

This project focuses on neuro-inclusive design. Contributions that improve accessibility for neurodivergent users are especially welcome.

## 📄 License

See LICENSE file for details.

---

**Made with ❤️ for the neurodivergent community**
