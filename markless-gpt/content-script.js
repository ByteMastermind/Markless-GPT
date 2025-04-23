(() => {
  'use strict';

  /* utils */
  const filterText = t => t
    .replace(/\u00A0/g, ' ')
    .replace(/\u202F/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '');

  /* logging */
  const logCopy = (raw, clean, origin) =>
    console.log(`[Markless-GPT] COPY (${origin})\n  raw   : ${JSON.stringify(raw)}\n  clean : ${JSON.stringify(clean)}`);

  /* toast */
  const showToast = () => {
    const el = document.createElement('div');
    el.textContent = 'Text safely copied!';
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
      transition: 'opacity .4s ease'
    });
    document.body.appendChild(el);
    setTimeout(() => (el.style.opacity = '0'), 1600);
    setTimeout(() => el.remove(), 2000);
  };

  window.addEventListener('markless-copy', showToast);

  /* “Copy”-button fallback */
  document.addEventListener(
    'click',
    e => {
      const btn = e.target.closest(
        'button[aria-label="Copy"],button[data-testid="copy-turn-action-button"]'
      );
      if (!btn) return;

      setTimeout(async () => {
        try {
          const raw   = await navigator.clipboard.readText();
          const clean = filterText(raw);
          await navigator.clipboard.writeText(clean);
          logCopy(raw, clean, 'button');
          showToast();
        } catch (err) {
          console.warn('[Markless-GPT] button copy failed:', err);
        }
      }, 100);
    },
    true
  );

  /* Ctrl-C / Ctrl-X */
  const getSelectedText = () => {
    const sel = window.getSelection();
    if (sel && sel.toString()) return sel.toString();

    const el = document.activeElement;
    if (
      el &&
      (el.tagName === 'TEXTAREA' ||
        (el.tagName === 'INPUT' && el.type === 'text'))
    )
      return el.value.substring(el.selectionStart, el.selectionEnd);

    return '';
  };

  const onCopyCut = e => {
    const cd = e.clipboardData;

    // path 1: site already filled clipboardData
    if (cd.types?.includes('text/plain')) {
      const raw = cd.getData('text/plain');
      const clean = filterText(raw);
      cd.clearData();
      cd.setData('text/plain', clean);
      cd.setData('text/html', clean);
      e.preventDefault();
      e.stopImmediatePropagation();
      logCopy(raw, clean, 'clipboardData');
      showToast();
      return;
    }

    // path 2: normal selection
    const rawSel = getSelectedText();
    if (!rawSel) return;

    const cleanSel = filterText(rawSel);
    cd.setData('text/plain', cleanSel);
    cd.setData('text/html', cleanSel);
    e.preventDefault();
    e.stopImmediatePropagation();
    logCopy(rawSel, cleanSel, 'selection');
    showToast();
  };

  document.addEventListener('copy', onCopyCut, true);
  document.addEventListener('cut',  onCopyCut, true);
})();
