// content‑script.js  — runs at document_start
(() => {
  'use strict';
  console.log('[Markless‑GPT] content script loaded');

  /* ========================================================= *
   *  0)  UTIL:  filtering + toast + logger                     *
   * ========================================================= */
  const filterText = txt =>
    txt
      .replace(/\u00A0/g, ' ')          // NB‑spaces → normal spaces
      .replace(/[\u200B-\u200D\uFEFF]/g, '');

  function logCopy(raw, clean, origin) {
    console.log(
      `[Markless‑GPT] COPY (${origin})\n` +
      `  raw   : ${JSON.stringify(raw)}\n` +
      `  clean : ${JSON.stringify(clean)}`
    );
  }

  /* quick inline toast – auto‑remove after 2 s */
  function showToast () {
    const toast = document.createElement('div');
    toast.textContent = 'Text safely copied !';
    Object.assign(toast.style, {
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
    document.body.appendChild(toast);
    setTimeout(() => (toast.style.opacity = '0'), 1600);
    setTimeout(() => toast.remove(), 2000);
  }

  /* listen for CustomEvent fired by page‑world patch */
  window.addEventListener('markless-copy', showToast);

  /* ========================================================= *
   *  1)  USER‑INITIATED copy / cut events                      *
   * ========================================================= */
  const getSelectedText = () => {
    const sel = window.getSelection();
    if (sel && sel.toString()) return sel.toString();

    const el = document.activeElement;
    if (el && (el.tagName === 'TEXTAREA' ||
               (el.tagName === 'INPUT' && el.type === 'text')))
      return el.value.substring(el.selectionStart, el.selectionEnd);

    return '';
  };

  document.addEventListener(
    'click',
    e => {
      const btn = e.target.closest('button[data-testid="copy-turn-action-button"]');
      if (!btn) return;
  
      /* let the site perform its copy first */
      setTimeout(async () => {
        try {
          const raw = await navigator.clipboard.readText();  // needs clipboardRead
          const clean = filterText(raw);
  
          // always overwrite clipboard with clean text
          await navigator.clipboard.writeText(clean);
          logCopy(raw, clean, 'button‑fallback');
          showToast();
        } catch (err) {
          console.warn('[Markless‑GPT] button‑fallback failed:', err);
        }
      }, 500); // 0.5 seconds
    },
    true /* capture – so we’re guaranteed to see the click */
  );
  
  const onCopyCut = e => {
    const cd = e.clipboardData;

    /* —————————————————— Path 1: site already populated clipboardData */
    if (cd.types?.includes('text/plain')) {
      const raw = cd.getData('text/plain');
      const clean = filterText(raw);
      cd.clearData();
      cd.setData('text/plain', clean);
      cd.setData('text/html',  clean);
      e.preventDefault();
      e.stopImmediatePropagation();
      logCopy(raw, clean, 'clipboardData');
      showToast();
      return;
    }

    /* —————————————————— Path 2: normal selection */
    const rawSel = getSelectedText();
    if (!rawSel) return;

    const cleanSel = filterText(rawSel);
    cd.setData('text/plain', cleanSel);
    cd.setData('text/html',  cleanSel);
    e.preventDefault();
    e.stopImmediatePropagation();
    logCopy(rawSel, cleanSel, 'selection');
    showToast();
  };

  document.addEventListener('copy', onCopyCut, true);
  document.addEventListener('cut',  onCopyCut, true);

  /* ========================================================= *
   *  2)  PAGE‑WORLD PATCH – covers ChatGPT copy button, etc.   *
   * ========================================================= */
  const patchCode = `
    (() => {
      const filterText = ${filterText.toString()};
      const log = ${logCopy.toString()}.bind(null);   // re‑use the logger

      const fireToast = () => window.dispatchEvent(new CustomEvent('markless-copy'));

      /* helper: replace plain/html blobs in a ClipboardItem */
      async function filtItem(item) {
        const pairs = await Promise.all(item.types.map(async type => {
          let blob = await item.getType(type);
          if (type === 'text/plain' || type === 'text/html') {
            const txt = await blob.text();
            const clean = filterText(txt);
            log(txt, clean, 'ClipboardItem');
            blob = new Blob([clean], { type });
          }
          return [type, blob];
        }));
        return new ClipboardItem(Object.fromEntries(pairs));
      }

      /* ───────────────── navigator.clipboard.writeText ───────────── */
      if (navigator.clipboard?.writeText) {
        const orig = navigator.clipboard.writeText.bind(navigator.clipboard);
        Object.defineProperty(navigator.clipboard, 'writeText', {
          value: (txt, ...rest) => {
            const clean = filterText(txt);
            log(txt, clean, 'writeText');
            fireToast();
            return orig(clean, ...rest);
          },
          writable: false, configurable: false
        });
      }

      /* ───────────────── navigator.clipboard.write ───────────────── */
      if (navigator.clipboard?.write) {
        const orig = navigator.clipboard.write.bind(navigator.clipboard);
        Object.defineProperty(navigator.clipboard, 'write', {
          value: async items => {
            const newItems = await Promise.all(items.map(filtItem));
            fireToast();
            return orig(newItems);
          },
          writable: false, configurable: false
        });
      }

      /* ───────────────── DataTransfer.setData (execCommand) ──────── */
      if (window.DataTransfer) {
        const origSet = DataTransfer.prototype.setData;
        DataTransfer.prototype.setData = function(type, data) {
          if (type === 'text/plain' || type === 'text/html') {
            const clean = filterText(data);
            log(data, clean, 'DataTransfer.setData');
            fireToast();
            return origSet.call(this, type, clean);
          }
          return origSet.call(this, type, data);
        };
      }

      /* ───────────────── document.execCommand('copy', … val) ─────── */
      const execOrig = Document.prototype.execCommand;
      Document.prototype.execCommand = function(cmd, showUI, val) {
        if (cmd === 'copy' && typeof val === 'string') {
          const clean = filterText(val);
          log(val, clean, 'execCommand');
          fireToast();
          return execOrig.call(this, cmd, showUI, clean);
        }
        return execOrig.call(this, cmd, showUI, val);
      };
    })();
  `;

  const s = document.createElement('script');
  s.textContent = patchCode;
  (document.documentElement || document.head).appendChild(s);
  s.remove();
})();
