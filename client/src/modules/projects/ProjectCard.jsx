import { Link } from 'react-router';
import { useAuth } from '../../auth/AuthContext.jsx';
import { Button, Card, Chip, StatusDot } from '../../components/ui.jsx';

export default function ProjectCard({ project, onInterest }) {
  const { user } = useAuth();
  const mine = user && project.owner?.id === user.id;
  return (
    <Card as="article" className="pcard">
      <div className="row between">
        <h3><Link className="link-title" to={`/projects/${project.id}`}>{project.title}</Link></h3>
        <StatusDot status={project.status} />
      </div>
      <p className="meta clamp3" style={{ fontSize: 15, lineHeight: '24px' }}>{project.description}</p>
      <div className="card-foot">
        <div className="row">
          {project.skills.map((s) => <Chip key={s}>{s}</Chip>)}
          <span className="meta"><span className="mono">{project.currentMembers}/{project.teamSize}</span> members · {project.department}</span>
        </div>
        <div className="actions">
          <Button as={Link} to={`/projects/${project.id}`} variant="tertiary">View</Button>
          {!mine && project.status === 'Open' && <Button variant="secondary" onClick={() => onInterest(project)}>Express interest</Button>}
        </div>
      </div>
    </Card>
  );
}
