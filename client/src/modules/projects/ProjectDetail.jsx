import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { api } from '../../lib/api.js';
import { formatDate } from '../../lib/format.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import { useAuthGate } from '../../auth/useAuthGate.js';
import Icon from '../../components/Icon.jsx';
import ReportButton from '../../components/ReportButton.jsx';
import { Button, Chip, EmptyState, ErrorState, Spinner, StatusDot } from '../../components/ui.jsx';
import RequestDialog from '../requests/RequestDialog.jsx';
import { useApi } from '../requests/useApi.js';
import '../requests/requests.css';
import './projects.css';

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const gate = useAuthGate();
  const [open, setOpen] = useState(false);
  const { data: p, error, loading, reload } = useApi(() => api.get(`/projects/${id}`), [id]);

  if (loading && !p) return <div className="wrap body"><Spinner /></div>;
  if (error?.status === 404) {
    return (
      <div className="wrap body">
        <EmptyState title="This project is not available.">
          <p className="meta">It may have been removed or is still waiting for approval.</p>
          <Button as={Link} to="/projects" variant="tertiary">Back to projects</Button>
        </EmptyState>
      </div>
    );
  }
  if (error) return <div className="wrap body"><ErrorState error={error} onRetry={reload} /></div>;

  const mine = user && p.owner?.id === user.id;
  const pct = Math.min(100, Math.round((p.currentMembers / p.teamSize) * 100));

  return (
    <div className="wrap body">
      <Link to="/projects" className="textlink"><Icon name="back" /> All projects</Link>

      {p.approval === 'pending' && (
        <div className="notice" style={{ marginTop: 20 }}><Icon name="info" /><span>This project is waiting for admin approval. Only you and the admins can see it.</span></div>
      )}
      {p.approval === 'rejected' && (
        <div className="rejection" style={{ marginTop: 20 }}>
          <strong>Not approved.</strong> {p.rejectionReason} <Link to={`/projects/${p.id}/edit`}>Edit and send it again</Link>.
        </div>
      )}
      {p.isRemoved && (
        <div className="rejection" style={{ marginTop: 20 }}>This project was removed by a moderator and is hidden from everyone else.</div>
      )}

      <div className="stack" style={{ marginTop: 24, maxWidth: 760 }}>
        <div className="row between">
          <h1>{p.title}</h1>
          <StatusDot status={p.status} />
        </div>
        <p style={{ whiteSpace: 'pre-wrap', fontSize: 16, lineHeight: '26px' }}>{p.description}</p>

        <dl className="kv">
          <dt>Skills wanted</dt>
          <dd className="row">{p.skills.map((s) => <Chip key={s}>{s}</Chip>)}</dd>
          <dt>School</dt>
          <dd>{p.department}</dd>
          <dt>Team</dt>
          <dd>
            <span className="mono">{p.currentMembers}/{p.teamSize}</span> people
            <div className="team-bar" role="img" aria-label={`${pct}% of the team is filled`}><span style={{ width: `${pct}%` }} /></div>
          </dd>
          <dt>Posted</dt>
          <dd>{formatDate(p.createdAt)}</dd>
          <dt>Posted by</dt>
          <dd className="owner-box">
            <strong>{p.owner.name}</strong>
            <span className="meta">{p.owner.department}{p.owner.batch ? ` · batch ${p.owner.batch}` : ''}</span>
            {p.owner.skills?.length > 0 && <span className="row">{p.owner.skills.map((s) => <Chip key={s}>{s}</Chip>)}</span>}
          </dd>
        </dl>

        <div className="actions">
          {mine ? (
            <>
              <Button as={Link} to={`/projects/${p.id}/edit`} variant="secondary">Edit project</Button>
              <Button as={Link} to="/me/requests?tab=received" variant="tertiary">See requests</Button>
            </>
          ) : (
            <>
              {p.status === 'Open' && p.approval === 'approved' ? (
                <Button variant="primary" onClick={() => gate('express interest', () => setOpen(true))}>Express interest</Button>
              ) : (
                <span className="meta">This project is not taking new members right now.</span>
              )}
              {p.approval === 'approved' && <ReportButton targetType="project" targetId={p.id} />}
            </>
          )}
        </div>
      </div>

      <RequestDialog
        open={open}
        onClose={() => setOpen(false)}
        targetType="project"
        targetId={p.id}
        title={`Join “${p.title}”`}
        intro="The owner sees your name, school and skills. Your contact details are shared only if they accept."
        placeholder="What would you work on?"
      />
    </div>
  );
}
