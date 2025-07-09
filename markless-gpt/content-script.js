(() => {
  'use strict';

  /* ───────── Config ───────── */
  const BUTTON_COPY_DELAY = 60; // ms – delay before we patch the clipboard

  /* ───────── Utils ───────── */
  const NBSPs      = /\u00A0|\u202F/g;
  const ZERO_WIDTH = /[\u200B-\u200D\uFEFF]/g;

  const filterText = t => t.replace(NBSPs, ' ').replace(ZERO_WIDTH, '');
  const unchanged  = (a, b) => a === b; // fast equality

  /* ───────── Logging ───────── */
  const log = (raw, clean, origin) => {
    if (unchanged(raw, clean)) return;
    console.log(`[Markless‑GPT] COPY (${origin})\n  raw   : ${JSON.stringify(raw)}\n  clean : ${JSON.stringify(clean)}`);
  };

  /* ───────── Toast ───────── */
  const showToast = () => {
    const el = document.createElement('div');
    el.textContent = 'Clipboard cleaned';
    Object.assign(el.style, {
      position: 'fixed',
      top: '12px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#2ecc71',
      color: '#fff',
      padding: '6px 12px',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '600',
      zIndex: 2147483647,
      boxShadow: '0 2px 6px rgba(0,0,0,.2)',
      opacity: '1',
      transition: 'opacity .3s ease'
    });
    document.body.appendChild(el);
    setTimeout(() => (el.style.opacity = '0'), 1300);
    setTimeout(() => el.remove(), 1600);
  };

  /* ───────── Selection helper ───────── */
  const getSelectionText = () => {
    const sel = window.getSelection();
    if (sel?.toString()) return sel.toString();

    const el = document.activeElement;
    if (el && (el.tagName === 'TEXTAREA' ||
              (el.tagName === 'INPUT' && el.type === 'text'))) {
      return el.value.slice(el.selectionStart, el.selectionEnd);
    }
    return '';
  };

  /* ───────── Generic copy/cut handler ───────── */
  const onCopyCut = e => {
    const cd = e.clipboardData;
    if (!cd) return;

    // Path 1: page already populated clipboardData
    if (cd.types?.includes('text/plain')) {
      const raw   = cd.getData('text/plain');
      const clean = filterText(raw);
      if (unchanged(raw, clean)) return;

      cd.clearData();
      cd.setData('text/plain', clean);
      cd.setData('text/html',  clean);
      e.stopImmediatePropagation();
      e.preventDefault();

      log(raw, clean, 'clipboardData');
      showToast();
      return;
    }

    // Path 2: normal selection
    const rawSel = getSelectionText();
    if (!rawSel) return;

    const cleanSel = filterText(rawSel);
    if (unchanged(rawSel, cleanSel)) return;

    cd.setData('text/plain', cleanSel);
    cd.setData('text/html',  cleanSel);
    e.stopImmediatePropagation();
    e.preventDefault();

    log(rawSel, cleanSel, 'selection');
    showToast();
  };

  document.addEventListener('copy', onCopyCut, true);
  document.addEventListener('cut',  onCopyCut, true);

  /* ───────── “Copy”‑button fallback ───────── */
  document.addEventListener('click', e => {
    const btn = e.target.closest(
      'button[aria-label="Copy"],button[data-testid="copy-turn-action-button"]'
    );
    if (!btn) return;

    // Let the page copy first, then clean the clipboard.
    setTimeout(async () => {
      try {
        const raw   = await navigator.clipboard.readText();
        const clean = filterText(raw);
        if (unchanged(raw, clean)) return;

        await navigator.clipboard.writeText(clean);
        log(raw, clean, 'button');
        showToast();
      } catch (err) {
        console.warn('[Markless‑GPT] Button copy failed:', err);
      }
    }, BUTTON_COPY_DELAY);
  }, true);
})();
