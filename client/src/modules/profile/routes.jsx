import RequireAuth from '../../components/RequireAuth.jsx';
import Profile from './Profile.jsx';
import MyPosts from './MyPosts.jsx';

export const routes = [
  { path: '/me/profile', element: <RequireAuth><Profile /></RequireAuth> },
  { path: '/me/posts', element: <RequireAuth><MyPosts /></RequireAuth> },
];
