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
      <p className="meta" style={{ fontSize: 15, lineHeight: '24px' }}>
        {project.description.length > 220 ? `${project.description.slice(0, 217)}…` : project.description}
      </p>
      <div className="card-foot">
        <div className="row">
          {project.skills.map((s) => <Chip key={s}>{s}</Chip>)}
          <span className="meta">{project.department} · team <span className="mono">{project.currentMembers}/{project.teamSize}</span></span>
        </div>
        {mine ? (
          <Button as={Link} to={`/projects/${project.id}`} variant="tertiary">Your project</Button>
        ) : (
          project.status === 'Open' && <Button variant="secondary" onClick={() => onInterest(project)}>Express interest</Button>
        )}
      </div>
    </Card>
  );
}
