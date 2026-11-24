const DAY_MS = 24 * 60 * 60 * 1000;

// formatRs(1200) -> "Rs 1,200"
export function formatRs(n) {
  return `Rs ${Number(n || 0).toLocaleString('en-PK')}`;
}

// formatDate("2026-11-12") -> "12 Nov 2026"
export function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// "Today", "Yesterday", "Tomorrow" or "12 Nov"
export function formatRelative(d) {
  if (!d) return '';
  const date = new Date(d);
  const startOf = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(date) - startOf(new Date())) / DAY_MS);
  if (diff === 0) return 'Today';
  if (diff === -1) return 'Yesterday';
  if (diff === 1) return 'Tomorrow';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// formatTime("08:00") -> "8:00 AM"; also accepts a Date/ISO string.
export function formatTime(t) {
  if (!t) return '';
  let h;
  let m;
  if (typeof t === 'string' && /^\d{2}:\d{2}$/.test(t)) [h, m] = t.split(':').map(Number);
  else {
    const d = new Date(t);
    h = d.getHours();
    m = d.getMinutes();
  }
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`;
}
