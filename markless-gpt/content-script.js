// content‑script.js   — runs in the page at document_start
(() => {
  'use strict';
  console.log('[Markless‑GPT] content script loaded');

  // 1) Your filter -----------------------------------------------------------
  const filterText = txt =>
    txt
      .replace(/\u00A0/g, ' ')          // NB‑spaces → normal spaces
      .replace(/[\u200B-\u200D\uFEFF]/g, ''); // zero‑width chars → nothing

  // 2) Get whatever the user has really selected ----------------------------
  const getSelectedText = () => {
    const sel = window.getSelection();
    if (sel && sel.toString()) return sel.toString();

    const el = document.activeElement;
    if (
      el &&
      (el.tagName === 'TEXTAREA' ||
        (el.tagName === 'INPUT' && el.type === 'text'))
    ) {
      return el.value.substring(el.selectionStart, el.selectionEnd);
    }
    return '';
  };

  // 3) copy / cut handler ----------------------------------------------------
  const onCopyCut = e => {
    const raw = getSelectedText();
    if (!raw) return;                    // nothing selected → do nothing

    const cleaned = filterText(raw);

    // Write into the clipboard _before_ anyone else can touch it
    e.clipboardData.setData('text/plain', cleaned);
    e.clipboardData.setData('text/html', cleaned);

    // Block the default copy & further page handlers
    e.preventDefault();
    e.stopImmediatePropagation();
  };

  // Capture phase so we run first
  document.addEventListener('copy', onCopyCut, true);
  document.addEventListener('cut',  onCopyCut, true);
})();
