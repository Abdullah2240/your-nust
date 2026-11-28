import { Link } from 'react-router';
import { Chip, StatusDot } from '../../components/ui.jsx';
import ApprovalQueue from '../requests/ApprovalQueue.jsx';
import './projects.css';

export default function ProjectApprovals() {
  return (
    <ApprovalQueue
      title="Project approvals"
      endpoint="/projects"
      emptyText="No projects waiting. All clear."
      renderBody={(p) => (
        <>
          <div className="row between">
            <Link className="link-title" to={`/projects/${p.id}`}>{p.title}</Link>
            <StatusDot status="pending" />
          </div>
          <p className="meta" style={{ fontSize: 15, lineHeight: '24px', whiteSpace: 'pre-wrap' }}>{p.description}</p>
          <div className="row">
            {p.skills.map((s) => <Chip key={s}>{s}</Chip>)}
            <span className="meta">{p.department} · team of <span className="mono">{p.teamSize}</span></span>
          </div>
        </>
      )}
    />
  );
}
