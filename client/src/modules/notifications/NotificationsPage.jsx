import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../../lib/api.js';
import { formatRelative } from '../../lib/format.js';
import { Button, EmptyState, ErrorState, PageHead, Segmented, Spinner } from '../../components/ui.jsx';
import Pagination from '../../components/Pagination.jsx';

export default function NotificationsPage() {
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const load = useCallback(() => {
    setError(null);
    api
      .get('/notifications', { unread: filter === 'unread' ? 'true' : undefined, page })
      .then(setData)
      .catch(setError);
  }, [filter, page]);

  useEffect(() => {
    load();
  }, [load]);

  const open = async (n) => {
    if (!n.read) await api.patch(`/notifications/${n.id}/read`).catch(() => {});
    if (n.link) navigate(n.link);
    else load();
  };

  const readAll = async () => {
    await api.patch('/notifications/read-all');
    load();
  };

  return (
    <>
      <PageHead
        title="Notifications"
        subtitle="Requests, decisions and updates about your posts."
        actions={<Button variant="secondary" onClick={readAll}>Mark all as read</Button>}
      />
      <div className="wrap body">
        <div style={{ marginBottom: 20 }}>
          <Segmented
            label="Filter"
            value={filter}
            onChange={(v) => { setFilter(v); setPage(1); }}
            options={[{ value: 'all', label: 'All' }, { value: 'unread', label: 'Unread' }]}
          />
        </div>
        {error && <ErrorState error={error} onRetry={load} />}
        {!error && !data && <Spinner />}
        {data && data.items.length === 0 && (
          <EmptyState title={filter === 'unread' ? "You're all caught up." : 'No notifications yet.'}>
            <p className="meta">When someone requests your post, or an admin reviews it, it shows up here.</p>
          </EmptyState>
        )}
        {data && data.items.length > 0 && (
          <>
            <div className="notif-list">
              {data.items.map((n) => (
                <button key={n.id} type="button" className={`notif${n.read ? '' : ' unread'}`} onClick={() => open(n)}>
                  <span className="dot" aria-hidden="true" />
                  <span>
                    <span className="notif-title">{n.title}</span>
                    {n.body && <span className="meta" style={{ display: 'block' }}>{n.body}</span>}
                  </span>
                  <span className="mono">{formatRelative(n.createdAt)}</span>
                </button>
              ))}
            </div>
            <Pagination page={data.page} pages={data.pages} onChange={setPage} />
          </>
        )}
      </div>
    </>
  );
}
