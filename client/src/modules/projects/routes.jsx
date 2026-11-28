import RequireAuth from '../../components/RequireAuth.jsx';
import ProjectsBrowse from './ProjectsBrowse.jsx';
import ProjectDetail from './ProjectDetail.jsx';
import ProjectForm from './ProjectForm.jsx';

export const routes = [
  { path: '/projects', element: <ProjectsBrowse /> },
  { path: '/projects/new', element: <RequireAuth verified><ProjectForm /></RequireAuth> },
  { path: '/projects/:id', element: <ProjectDetail /> },
  { path: '/projects/:id/edit', element: <RequireAuth verified><ProjectForm /></RequireAuth> },
];
