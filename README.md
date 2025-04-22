## 🚀 Features

- **Automatic Filtering**  
  Intercepts both manual copy (Ctrl+C/⌘+C) and programmatic clipboard writes (e.g. “Copy” buttons), funneling every snippet through a customizable text‑processing pipeline.

- **Watermark Removal**  
  Detect and remove special characters or invisible markers that some models inject to tag AI‑generated text—leaving you with clean, human‑readable content.

- **Zero Permissions Overhead**  
  No extra “clipboardWrite” permission required—PurePaste hooks into the page’s native copy/cut events and the modern `navigator.clipboard.writeText` API.

- **Domain‑Aware Toggle**  
  Easily enable or disable filtering on a per‑site basis via the extension’s popup UI.

- **Extensible Filter Function**  
  Replace the built‑in `filterText()` routine with your own logic (regex, profanity filters, token redaction, etc.).

---

## 📦 Installation

1. Clone this repository  
   ```bash
   git clone https://github.com/ByteMastermind/Markless-GPT.git
   ```

2. Load into your Chromium‑based browser  
   - Go to `chrome://extensions/` (or `edge://extensions/`, etc.)  
   - Enable “Developer mode”  
   - Click **Load unpacked** and select this repo’s root folder  

3. Enjoy watermark‑free copying!

---

## ⚙️ Usage

1. Click the Markless-GPT toolbar icon to toggle filtering on or off for the current domain.  
2. Copy text as you normally would—either by selecting and hitting Ctrl+C (⌘+C) or by clicking any “Copy” buttons on the page.  
3. Paste: you’ll get the same text, minus any hidden watermark markers.

---

## 🛠️ Customizing the Filter

Open `content-script.js` and edit:
```js
function filterText(input) {
  // Default: strip out all non‑printable (zero‑width) characters
  return input.replace(/[\u200B-\u200D\uFEFF]/g, '');
}
```
You can swap in your own regex, call out to a background script for heavy processing, or integrate third‑party libraries.

---

## 💡 Why PurePaste?

LLMs sometimes embed invisible tokens or special characters to “mark” AI‑generated text. PurePaste ensures that anything you copy and paste is free of these behind‑the‑scenes markers, making your workflows cleaner and more reliable.

---

## 📄 License

MIT © 
