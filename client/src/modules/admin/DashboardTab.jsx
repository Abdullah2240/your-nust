import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { api } from '../../lib/api.js';
import { ErrorState, Spinner } from '../../components/ui.jsx';

// Each tile links to the tab that handles it. Tabs from B and C may not exist yet; then the tile isn't a link.
const TILES = [
  { key: 'openReports', label: 'Open reports', to: 'reports' },
  { key: 'pendingProjects', label: 'Projects waiting', to: 'project-approvals' },
  { key: 'pendingRides', label: 'Recurring rides waiting', to: 'ride-approvals' },
  { key: 'lostOpen', label: 'Open Lost & Found', to: null, href: '/lost-found' },
  { key: 'menuItems', label: 'Menu items', to: 'cafeterias' },
  { key: 'users', label: 'Members', to: 'users' },
  { key: 'verifiedUsers', label: 'Verified members', to: 'users' },
];

export default function DashboardTab({ availablePaths = [] }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setError(null);
    api.get('/admin/stats').then(setStats).catch(setError);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <ErrorState error={error} onRetry={load} />;
  if (!stats) return <Spinner />;

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Dashboard</h2>
      <div className="stat-grid">
        {TILES.map((t) => {
          const body = (
            <>
              <span className="eyebrow">{t.label}</span>
              <span className="mono">{stats[t.key] ?? 0}</span>
            </>
          );
          const target = t.to && availablePaths.includes(t.to) ? `/admin/${t.to}` : t.href;
          return target ? (
            <Link key={t.key} to={target} className="stat stat-link">{body}</Link>
          ) : (
            <div key={t.key} className="stat">{body}</div>
          );
        })}
      </div>
    </div>
  );
}
