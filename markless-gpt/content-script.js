// content-script.js
(function() {
  'use strict';
  console.log('[Markless‑GPT] content script loaded');

  // ——————————————————————
  // 1) Your filter
  // ——————————————————————
  function filterText(input) {
    let text = input.replace(/\u00A0/g, ' ');
    text = text.replace(/[\u200B-\u200D\uFEFF]/g, '');
    return text;
  }

  // ——————————————————————
  // 2) Helper to grab whatever text is really being copied
  // ——————————————————————
  function getSelectedText() {
    const sel = window.getSelection();
    if (sel && sel.toString()) {
      return sel.toString();
    }
    const ae = document.activeElement;
    if (ae && (ae.tagName === 'TEXTAREA' ||
               (ae.tagName === 'INPUT' && ae.type === 'text'))) {
      const start = ae.selectionStart;
      const end   = ae.selectionEnd;
      return ae.value.substring(start, end);
    }
    return '';
  }

  // ——————————————————————
  // 3) copy/cut event handler
  // ——————————————————————
  function onCopyCut(e) {
    const raw = getSelectedText();
    console.log('[Markless‑GPT] onCopyCut raw:', JSON.stringify(raw));
    if (!raw) return; // nothing we can do

    const out = filterText(raw);
    console.log('[Markless‑GPT] onCopyCut filtered:', JSON.stringify(out));

    e.clipboardData.clearData();
    e.clipboardData.setData('text/plain', out);
    e.clipboardData.setData('text/html',  out);
    e.preventDefault();
  }
  document.addEventListener('copy', onCopyCut, true);
  document.addEventListener('cut',  onCopyCut, true);

  // ——————————————————————
  // 4) navigator.clipboard.writeText
  // ——————————————————————
  if (navigator.clipboard && navigator.clipboard.writeText) {
    console.log('[Markless‑GPT] patching clipboard.writeText');
    const orig = navigator.clipboard.writeText.bind(navigator.clipboard);
    navigator.clipboard.writeText = (text, ...args) => {
      console.log('[Markless‑GPT] writeText called with:', JSON.stringify(text));
      const filtered = filterText(text);
      console.log('[Markless‑GPT] writeText filtered:', JSON.stringify(filtered));
      return orig(filtered, ...args);
    };
  }

  // ——————————————————————
  // 5) navigator.clipboard.write (ClipboardItem API)
  // ——————————————————————
  if (navigator.clipboard && navigator.clipboard.write) {
    console.log('[Markless‑GPT] patching clipboard.write');
    const orig = navigator.clipboard.write.bind(navigator.clipboard);
    navigator.clipboard.write = async (items) => {
      const newItems = await Promise.all(items.map(async item => {
        if (item.types.includes('text/plain')) {
          const blob = await item.getType('text/plain');
          const text = await blob.text();
          const filtered = filterText(text);
          console.log('[Markless‑GPT] write(ClipboardItem) filtered:', JSON.stringify(filtered));
          return new ClipboardItem({
            'text/plain': new Blob([filtered], { type: 'text/plain' })
          });
        }
        return item;
      }));
      return orig(newItems);
    };
  }

  // ——————————————————————
  // 6) execCommand fallback
  // ——————————————————————
  const origExec = Document.prototype.execCommand;
  Document.prototype.execCommand = function(cmd, showUI, val) {
    if (cmd === 'copy' && typeof val === 'string') {
      console.log('[Markless‑GPT] execCommand copy with val:', JSON.stringify(val));
      val = filterText(val);
      console.log('[Markless‑GPT] execCommand filtered val:', JSON.stringify(val));
      return origExec.call(this, cmd, showUI, val);
    }
    return origExec.call(this, cmd, showUI, val);
  };
})();
