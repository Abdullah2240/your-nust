import RequireAuth from '../../components/RequireAuth.jsx';
import NotificationsPage from './NotificationsPage.jsx';

export const routes = [
  { path: '/notifications', element: <RequireAuth><NotificationsPage /></RequireAuth> },
];
