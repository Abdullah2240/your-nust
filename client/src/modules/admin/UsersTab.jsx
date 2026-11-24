import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext.jsx';
import { api } from '../../lib/api.js';
import { formatDate } from '../../lib/format.js';
import { Button, EmptyState, ErrorState, Input, Spinner, StatusDot } from '../../components/ui.jsx';
import Modal from '../../components/Modal.jsx';
import Pagination from '../../components/Pagination.jsx';
import { useToast } from '../../components/Toast.jsx';

export default function UsersTab() {
  const { user: me } = useAuth();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { setQuery(q); setPage(1); }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(() => {
    setError(null);
    api.get('/admin/users', { q: query, page }).then(setData).catch(setError);
  }, [query, page]);

  useEffect(() => {
    load();
  }, [load]);

  const changeRole = async () => {
    setBusy(true);
    try {
      await api.patch(`/admin/users/${confirm.user.id}/role`, { role: confirm.role });
      toast(confirm.role === 'admin' ? `${confirm.user.name} is now an admin.` : `${confirm.user.name} is now a member.`);
      setConfirm(null);
      load();
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="row between" style={{ marginBottom: 20 }}>
        <h2>Users and roles</h2>
        <Input style={{ maxWidth: 280 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email" aria-label="Search users" />
      </div>
      {error && <ErrorState error={error} onRetry={load} />}
      {!error && !data && <Spinner />}
      {data && data.items.length === 0 && <EmptyState title="No users match that search." />}
      {data && data.items.length > 0 && (
        <>
          <div className="table-scroll">
            <table className="table">
              <thead><tr><th>Name</th><th>Email</th><th>School</th><th>Joined</th><th>Role</th></tr></thead>
              <tbody>
                {data.items.map((u) => (
                  <tr key={u.id}>
                    <td>
                      {u.name}
                      {!u.isVerified && <div><StatusDot status="pending" label="Not verified" /></div>}
                    </td>
                    <td className="muted">{u.email}</td>
                    <td className="mono">{u.department}</td>
                    <td className="mono">{formatDate(u.createdAt)}</td>
                    <td>
                      {u.id === me.id ? (
                        <span className="meta">Admin (you)</span>
                      ) : (
                        <Button
                          variant="tertiary"
                          onClick={() => setConfirm({ user: u, role: u.role === 'admin' ? 'member' : 'admin' })}
                        >
                          {u.role === 'admin' ? 'Admin · remove' : 'Make admin'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={data.page} pages={data.pages} onChange={setPage} />
        </>
      )}
      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm?.role === 'admin' ? `Make ${confirm?.user.name} an admin?` : `Remove ${confirm?.user.name}'s admin role?`}
        footer={
          <>
            <Button variant="tertiary" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button variant="primary" disabled={busy} onClick={changeRole}>{confirm?.role === 'admin' ? 'Make admin' : 'Remove admin role'}</Button>
          </>
        }
      >
        <p className="muted">
          {confirm?.role === 'admin'
            ? 'Admins can edit cafeteria menus, approve posts, remove reported content and manage users.'
            : 'They keep their account and posts, but lose access to the admin panel.'}
        </p>
      </Modal>
    </div>
  );
}
