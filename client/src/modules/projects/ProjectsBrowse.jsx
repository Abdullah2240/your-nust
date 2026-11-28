import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { api } from '../../lib/api.js';
import { SCHOOLS } from '../../lib/constants.js';
import { useAuthGate } from '../../auth/useAuthGate.js';
import Pagination from '../../components/Pagination.jsx';
import Modal from '../../components/Modal.jsx';
import { Button, EmptyState, ErrorState, Field, Input, PageHead, Select, Spinner } from '../../components/ui.jsx';
import RequestDialog from '../requests/RequestDialog.jsx';
import { useApi } from '../requests/useApi.js';
import ProjectCard from './ProjectCard.jsx';
import './projects.css';

const SIZES = [
  { value: '', label: 'Any size' },
  { value: '2-3', label: '2 to 3 people' },
  { value: '4-5', label: '4 to 5 people' },
  { value: '6-20', label: '6 or more' },
];

export default function ProjectsBrowse() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const gate = useAuthGate();
  const [target, setTarget] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const picked = (params.get('skill') || '').split(',').filter(Boolean);
  const department = params.get('department') || '';
  const status = params.get('status') || '';
  const size = params.get('size') || '';
  const q = params.get('q') || '';
  const page = Number(params.get('page')) || 1;

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries({ page: '', ...changes }).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  };

  const [minTeam, maxTeam] = size ? size.split('-') : [];
  const skillsQuery = useApi(() => api.get('/projects/skills'), []);
  const { data, error, loading, reload } = useApi(
    () => api.get('/projects', { skill: picked.join(','), department, status, minTeam, maxTeam, q, page }),
    [picked.join(','), department, status, size, q, page],
  );

  const toggleSkill = (s) => update({ skill: (picked.includes(s) ? picked.filter((x) => x !== s) : [...picked, s]).join(',') });

  return (
    <>
      <PageHead
        title="Projects"
        subtitle="Find teammates by skill. New posts are checked by an admin before they appear."
        actions={<Button variant="primary" onClick={() => gate('post a project', () => navigate('/projects/new'))}>Post a project</Button>}
      />
      <div className="wrap body">
        <div className="split">
          <aside className="filters only-desktop" aria-label="Filters">
            <Field label="Search" id="proj-q">
              {(id) => <Input id={id} type="search" value={q} onChange={(e) => update({ q: e.target.value })} placeholder="Title or keyword" />}
            </Field>
            <p className="label-like" id="skills-label">Skills</p>
            <div className="skillpick" role="group" aria-labelledby="skills-label">
              {(skillsQuery.data || []).map((s) => (
                <button key={s} type="button" className={`chip${picked.includes(s) ? ' on' : ''}`} aria-pressed={picked.includes(s)} onClick={() => toggleSkill(s)}>{s}</button>
              ))}
              {skillsQuery.data?.length === 0 && <span className="meta">No skills yet.</span>}
            </div>
            <Field label="School">
              {(id) => <Select id={id} value={department} onChange={(e) => update({ department: e.target.value })} options={[{ value: '', label: 'All schools' }, ...SCHOOLS]} />}
            </Field>
            <Field label="Status">
              {(id) => <Select id={id} value={status} onChange={(e) => update({ status: e.target.value })} options={[{ value: '', label: 'Any' }, 'Open', 'Closed']} />}
            </Field>
            <Field label="Team size" className="no-margin">
              {(id) => <Select id={id} value={size} onChange={(e) => update({ size: e.target.value })} options={SIZES} />}
            </Field>
          </aside>
          <div>
            <Button className="only-mobile" variant="secondary" onClick={() => setFiltersOpen(true)}>Filters{picked.length + [department, status, size].filter(Boolean).length ? ` (${picked.length + [department, status, size].filter(Boolean).length})` : ''}</Button>
            {error && <ErrorState error={error} onRetry={reload} />}
            {!error && loading && !data && <Spinner />}
            {data && (
              <>
                <p className="count" aria-live="polite">{data.total} project{data.total === 1 ? '' : 's'}</p>
                {data.items.length === 0 ? (
                  <EmptyState title="No projects match these filters.">
                    <p className="meta">Try removing a skill or school, or post your own project.</p>
                  </EmptyState>
                ) : (
                  <div className="stack">
                    {data.items.map((p) => <ProjectCard key={p.id} project={p} onInterest={(proj) => gate('express interest', () => setTarget(proj))} />)}
                    <Pagination page={data.page} pages={data.pages} onChange={(p) => update({ page: String(p) })} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <Modal open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filters" footer={<Button variant="primary" onClick={() => setFiltersOpen(false)}>Show projects</Button>}>
        <div className="filters" style={{ position: 'static', border: 0, padding: 0 }}>
            <Field label="Search" id="proj-q">
                {(id) => <Input id={id} type="search" value={q} onChange={(e) => update({ q: e.target.value })} placeholder="Title or keyword" />}
              </Field>
              <p className="label-like" id="skills-label">Skills</p>
              <div className="skillpick" role="group" aria-labelledby="skills-label">
                {(skillsQuery.data || []).map((s) => (
                  <button key={s} type="button" className={`chip${picked.includes(s) ? ' on' : ''}`} aria-pressed={picked.includes(s)} onClick={() => toggleSkill(s)}>{s}</button>
                ))}
                {skillsQuery.data?.length === 0 && <span className="meta">No skills yet.</span>}
              </div>
              <Field label="School">
                {(id) => <Select id={id} value={department} onChange={(e) => update({ department: e.target.value })} options={[{ value: '', label: 'All schools' }, ...SCHOOLS]} />}
              </Field>
              <Field label="Status">
                {(id) => <Select id={id} value={status} onChange={(e) => update({ status: e.target.value })} options={[{ value: '', label: 'Any' }, 'Open', 'Closed']} />}
              </Field>
              <Field label="Team size" className="no-margin">
                {(id) => <Select id={id} value={size} onChange={(e) => update({ size: e.target.value })} options={SIZES} />}
              </Field>
        </div>
      </Modal>
      <RequestDialog
        open={!!target}
        onClose={() => setTarget(null)}
        targetType="project"
        targetId={target?.id}
        title={`Join “${target?.title ?? ''}”`}
        intro="The owner sees your name, school and skills. Your contact details are shared only if they accept."
        placeholder="What would you work on?"
      />
    </>
  );
}
