// Escapes user text so it can be used safely inside new RegExp(...).
export function escapeRegex(str) {
  return String(str ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
