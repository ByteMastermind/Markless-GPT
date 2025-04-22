// 1) A simple text‐processing function
function filterText(str) {
  // e.g. remove all digits, or run a profanity filter, etc.
  return str.replace(/\d+/g, '');
}

// 2) Handler for both copy and cut
function onCopyCut(e) {
  // get the selected text
  const selectedText = window.getSelection().toString();
  if (!selectedText) return;       // nothing to do

  // run it through your filter
  const processed = filterText(selectedText);

  // overwrite the clipboard contents
  e.clipboardData.clearData();
  e.clipboardData.setData('text/plain', processed);
  e.clipboardData.setData('text/html', processed);
  e.preventDefault();              // tell the browser "we've done it"
}

// 3) Hook into page events
document.addEventListener('copy', onCopyCut, true);
document.addEventListener('cut',  onCopyCut, true);

// 4) (Optional) Monkey‐patch navigator.clipboard.writeText()
//    so script calls on the page also get filtered.
if (navigator.clipboard) {
  const origWrite = navigator.clipboard.writeText.bind(navigator.clipboard);
  navigator.clipboard.writeText = (text) => {
    const filtered = filterText(text);
    return origWrite(filtered);
  };
}

