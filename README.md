Here’s an updated README reflecting the slimmed-down extension (the online tool is still live, even though it doesn’t surface in the extension UI):

```markdown
# Markless-GPT

A lightweight Chromium extension that cleans out hidden watermark markers (zero-width and similar) from any text you copy—whether via Ctrl +C/⌘ +C, programmatic “Copy” buttons, or cut events—so you always get plain, human-readable content.

> **Online tool available:**  
> https://bytemastermind.github.io/Markless-GPT/

---

## 🚀 Features

- **Automatic Filtering**  
  Intercepts every copy- or cut-event on the page and runs it through a simple `filterText()` pipeline.
- **Watermark Removal**  
  Strips zero-width spaces, non-breaking spaces, and other invisible markers often injected by AI models.
- **Button-Click Fallback**  
  Detects “Copy” buttons, lets the page write first, then cleans up what lands on the clipboard.
- **Inline Toast & Logging**  
  Brief “Text safely copied!” toast for feedback plus console logs of raw vs. cleaned text.
- **No Extra Permissions**  
  Works without requesting any special `"clipboardWrite"` or host permissions—hooks into existing copy/cut handlers and the standard Clipboard API.

---

## 📦 Installation

1. **Clone** the repo  
   ```bash
   git clone https://github.com/ByteMastermind/Markless-GPT.git
   ```
2. **Load** into your browser  
   - Navigate to `chrome://extensions/` (or `edge://extensions/`, etc.)  
   - Enable **Developer mode**  
   - Click **Load unpacked** and select the `markless-gpt/` folder  

That’s it - no restart needed.

---

## ⚙️ Usage

1. Copy or cut anything on any page in your Chromium-based browser:  
   - **Keyboard** → Ctrl +C / Ctrl + X (⌘ +C / ⌘ + X on macOS)  
   - **Buttons** → a traditional copy buttons on the page
2. Paste anywhere - you’ll get the exact same text minus hidden watermark characters.  

---

## 🛠️ Customizing the Filter

Open `content-script.js` and tweak the `filterText` function:

```js
// Default removes common zero-width / invisible chars:
const filterText = input =>
  input
    .replace(/\u00A0/g, ' ')
    .replace(/\u202F/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '');
```

Feel free to extend it with your own regex rules, profanity filters, token redaction, or remote processing via a background script.

---

## 💡 Why Markless-GPT?

LLMs and other pipelines sometimes slip in invisible markers to tag AI-generated text. Markless-GPT makes sure anything you copy is free of these hidden artifacts—no permissions, no popups, just clean text.

---

## 📄 License

MIT © [ByteMastermind](https://github.com/ByteMastermind)
