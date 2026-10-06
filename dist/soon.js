// Waitlist, X and Email have no link yet: clicking one shows a small "Coming soon" just above it for a moment, set like the
// founders' cards (a 1 px black border round white, over a fine dithered shadow). It is announced to screen readers.
const note = document.createElement('div');
note.className = 'soon';
note.setAttribute('role', 'status');
document.body.append(note);
let timer = 0;

for (const tab of document.querySelectorAll('[data-soon]')) tab.addEventListener('click', e => {
  e.preventDefault();
  const r = tab.getBoundingClientRect();
  note.textContent = 'Coming soon';
  note.classList.add('shown');
  // Above the tab, its right edge on the tab's, kept on screen.
  const w = note.offsetWidth;
  note.style.left = `${Math.max(8, Math.min(r.right - w, innerWidth - w - 14)) + scrollX}px`;
  note.style.top = `${r.top + scrollY - note.offsetHeight - 10}px`;
  clearTimeout(timer);
  timer = setTimeout(() => note.classList.remove('shown'), 1600);
});
