import RequireAuth from '../../components/RequireAuth.jsx';
import AdminLayout from './AdminLayout.jsx';

export const routes = [
  { path: '/admin/*', element: <RequireAuth admin><AdminLayout /></RequireAuth> },
];
