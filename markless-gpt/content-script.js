// wrap in IIFE so we don’t leak globals
(function() {
  'use strict';

  // ——————————————————————
  // 1) Your filtering logic
  // ——————————————————————
  function filterText(input) {
    // Normalize NBSP → space
    let text = input.replace(/\u00A0/g, ' ');
    // Strip zero‑width chars
    text = text.replace(/[\u200B-\u200D\uFEFF]/g, '');
    return text;
  }

  // ——————————————————————
  // 2) Intercept copy & cut events
  // ——————————————————————
  function onCopyCut(e) {
    const raw = window.getSelection().toString();
    if (!raw) return;
    const out = filterText(raw);

    e.clipboardData.clearData();
    e.clipboardData.setData('text/plain', out);
    e.clipboardData.setData('text/html', out);
    e.preventDefault();
  }
  document.addEventListener('copy', onCopyCut, true);
  document.addEventListener('cut',  onCopyCut,  true);


  // ——————————————————————
  // 3) Monkey‑patch navigator.clipboard.writeText
  // ——————————————————————
  if (navigator.clipboard && navigator.clipboard.writeText) {
    const origWriteText = navigator.clipboard.writeText.bind(navigator.clipboard);
    navigator.clipboard.writeText = (text, ...rest) => {
      return origWriteText(filterText(text), ...rest);
    };
  }

  // ——————————————————————
  // 4) Also patch navigator.clipboard.write (ClipboardItem API)
  // ——————————————————————
  if (navigator.clipboard && navigator.clipboard.write) {
    const origWrite = navigator.clipboard.write.bind(navigator.clipboard);
    navigator.clipboard.write = async (items) => {
      const newItems = await Promise.all(items.map(async item => {
        if (item.types.includes('text/plain')) {
          const blob = await item.getType('text/plain');
          const text = await blob.text();
          const filtered = filterText(text);
          return new ClipboardItem({
            'text/plain': new Blob([filtered], { type: 'text/plain' })
          });
        }
        return item;
      }));
      return origWrite(newItems);
    };
  }

  // ——————————————————————
  // 5) Patch execCommand fallback
  // ——————————————————————
  const origExec = Document.prototype.execCommand;
  Document.prototype.execCommand = function(cmd, showUI, val) {
    if (cmd === 'copy' && typeof val === 'string') {
      val = filterText(val);
      return origExec.call(this, cmd, showUI, val);
    }
    return origExec.call(this, cmd, showUI, val);
  };

})();
