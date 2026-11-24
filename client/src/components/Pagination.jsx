// <Pagination page={2} pages={5} onChange={setPage} />
export default function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null;
  return (
    <nav className="pagination" aria-label="Pages">
      <button type="button" className="btn btn-tertiary" disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</button>
      <span className="meta">Page <span className="mono">{page}</span> of <span className="mono">{pages}</span></span>
      <button type="button" className="btn btn-tertiary" disabled={page >= pages} onClick={() => onChange(page + 1)}>Next</button>
    </nav>
  );
}
