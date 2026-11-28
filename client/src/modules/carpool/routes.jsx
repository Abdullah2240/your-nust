import RequireAuth from '../../components/RequireAuth.jsx';
import CarpoolBrowse from './CarpoolBrowse.jsx';
import RideDetail from './RideDetail.jsx';
import RideForm from './RideForm.jsx';

// Carpool is for verified members only, so every page is guarded.
export const routes = [
  { path: '/carpool', element: <RequireAuth verified><CarpoolBrowse /></RequireAuth> },
  { path: '/carpool/new', element: <RequireAuth verified><RideForm /></RequireAuth> },
  { path: '/carpool/:id', element: <RequireAuth verified><RideDetail /></RequireAuth> },
  { path: '/carpool/:id/edit', element: <RequireAuth verified><RideForm /></RequireAuth> },
];
