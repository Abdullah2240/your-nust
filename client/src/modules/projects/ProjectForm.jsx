// Used for both /projects/new and /projects/:id/edit.
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { api } from '../../lib/api.js';
import { SCHOOLS } from '../../lib/constants.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import SkillInput from '../../components/SkillInput.jsx';
import { useToast } from '../../components/Toast.jsx';
import { Button, Card, ErrorState, Field, Input, PageHead, Segmented, Select, Spinner, Textarea } from '../../components/ui.jsx';
import './projects.css';

export default function ProjectForm() {
  const { id } = useParams();
  const editing = !!id;
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [loaded, setLoaded] = useState(!editing);
  const [loadError, setLoadError] = useState(null);
  const [locked, setLocked] = useState(false); // approved projects only allow status and team size
  const [form, setForm] = useState({
    title: '', description: '', skills: [], department: user?.department && SCHOOLS.includes(user.department) ? user.department : 'SEECS', teamSize: '3', status: 'Open',
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!editing) return;
    api.get(`/projects/${id}`)
      .then((p) => {
        setForm({ title: p.title, description: p.description, skills: p.skills, department: p.department, teamSize: String(p.teamSize), status: p.status });
        setLocked(p.approval === 'approved');
        setLoaded(true);
      })
      .catch(setLoadError);
  }, [editing, id]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setFormError('');
    try {
      const body = locked
        ? { teamSize: Number(form.teamSize), status: form.status }
        : { title: form.title, description: form.description, skills: form.skills, department: form.department, teamSize: Number(form.teamSize) };
      if (editing) {
        await api.patch(`/projects/${id}`, body);
        toast('Project updated.');
        navigate(`/projects/${id}`);
      } else {
        const created = await api.post('/projects', body);
        toast('Submitted. An admin will review it shortly.');
        navigate(`/projects/${created.id}`);
      }
    } catch (err) {
      setErrors(err.fields || {});
      setFormError(Object.keys(err.fields || {}).length ? '' : err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loadError) return <div className="wrap body"><ErrorState error={loadError} /></div>;
  if (!loaded) return <div className="wrap body"><Spinner /></div>;

  return (
    <>
      <PageHead title={editing ? 'Edit project' : 'Post a project'} subtitle="An admin checks every new project before it appears." />
      <div className="wrap body">
        <Card className="form-card">
          <form onSubmit={submit} noValidate>
            {formError && <p className="form-error" role="alert">{formError}</p>}
            {locked && <p className="muted" style={{ marginBottom: 18 }}>This project is live, so you can only change its status and team size.</p>}
            <Field label="Title" error={errors.title}>
              {(fid) => <Input id={fid} value={form.title} onChange={set('title')} maxLength={100} disabled={locked} invalid={!!errors.title} placeholder="For example: Campus delivery app" />}
            </Field>
            <Field label="Description" error={errors.description} hint="What are you building and what help do you need?">
              {(fid) => <Textarea id={fid} rows={5} value={form.description} onChange={set('description')} maxLength={2000} disabled={locked} invalid={!!errors.description} />}
            </Field>
            <Field label="Skills you are looking for" error={errors.skills} hint="Up to 10.">
              {(fid) => <SkillInput id={fid} value={form.skills} onChange={(skills) => !locked && setForm((f) => ({ ...f, skills }))} max={10} invalid={!!errors.skills} />}
            </Field>
            <div className="grid2">
              <Field label="School" error={errors.department}>
                {(fid) => <Select id={fid} value={form.department} onChange={set('department')} options={SCHOOLS} disabled={locked} invalid={!!errors.department} />}
              </Field>
              <Field label="Team size" error={errors.teamSize} hint="Including you">
                {(fid) => <Input id={fid} type="number" min="2" max="20" value={form.teamSize} onChange={set('teamSize')} invalid={!!errors.teamSize} />}
              </Field>
            </div>
            {locked && (
              <Field label="Status" error={errors.status}>
                <Segmented label="Project status" value={form.status} onChange={(v) => setForm((f) => ({ ...f, status: v }))} options={[{ value: 'Open', label: 'Open' }, { value: 'Closed', label: 'Closed' }]} />
              </Field>
            )}
            <div className="actions" style={{ marginTop: 8 }}>
              <Button as={Link} to={editing ? `/projects/${id}` : '/projects'} variant="tertiary">Cancel</Button>
              <Button variant="primary" type="submit" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Submit for approval'}</Button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}
