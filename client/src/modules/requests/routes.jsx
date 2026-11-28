import RequireAuth from '../../components/RequireAuth.jsx';
import MyRequests from './MyRequests.jsx';

export const routes = [
  { path: '/me/requests', element: <RequireAuth verified><MyRequests /></RequireAuth> },
];
