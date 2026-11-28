import { useState } from 'react';
import { Link } from 'react-router';
import { api } from '../../lib/api.js';
import { formatRelative } from '../../lib/format.js';
import Pagination from '../../components/Pagination.jsx';
import { Button, Card, Chip, EmptyState, ErrorState, Spinner, StatusDot } from '../../components/ui.jsx';
import { useApi } from '../requests/useApi.js';
import '../requests/requests.css';
import './projects.css';

export default function MyProjects() {
  const [page, setPage] = useState(1);
  const { data, error, loading, reload } = useApi(() => api.get('/projects/mine', { page }), [page]);

  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (loading && !data) return <Spinner />;
  if (data.items.length === 0) {
    return (
      <EmptyState title="You haven't posted a project yet.">
        <Button as={Link} to="/projects/new" variant="tertiary">Post a project</Button>
      </EmptyState>
    );
  }

  return (
    <div className="stack">
      {data.items.map((p) => (
        <Card key={p.id} className="pcard">
          <div className="row between">
            <Link className="link-title" to={`/projects/${p.id}`}>{p.title}</Link>
            <div className="row">
              {p.isRemoved ? <StatusDot status="rejected" label="Removed by moderator" /> : <StatusDot status={p.approval} label={p.approval === 'approved' ? 'Live' : undefined} />}
              {p.approval === 'approved' && !p.isRemoved && <StatusDot status={p.status} />}
            </div>
          </div>
          {p.approval === 'rejected' && <p className="rejection"><strong>Reason:</strong> {p.rejectionReason}</p>}
          <div className="card-foot">
            <div className="row">
              {p.skills.map((s) => <Chip key={s}>{s}</Chip>)}
              <span className="meta">team <span className="mono">{p.currentMembers}/{p.teamSize}</span> · <span className="mono">{formatRelative(p.createdAt)}</span></span>
            </div>
            {!p.isRemoved && <Button as={Link} to={`/projects/${p.id}/edit`} variant="tertiary">Edit</Button>}
          </div>
        </Card>
      ))}
      <Pagination page={data.page} pages={data.pages} onChange={setPage} />
    </div>
  );
}
