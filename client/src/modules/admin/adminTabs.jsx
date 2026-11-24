// Admin panel tab registry (shared contract section 5.3). Each part ONLY uncomments its own lines.
import DashboardTab from './DashboardTab.jsx';
// import UsersTab from './UsersTab.jsx';                                   // Part A, task A9
// import DomainsTab from './DomainsTab.jsx';                               // Part A, task A9
// import ReportsTab from './ReportsTab.jsx';                               // Part A, task A8
// import CafeteriaAdmin from '../cafeterias/CafeteriaAdmin.jsx';           // Part B (Saniya)
// import ProjectApprovals from '../projects/ProjectApprovals.jsx';         // Part C (Anosh)
// import RideApprovals from '../carpool/RideApprovals.jsx';                // Part C (Anosh)

export const adminTabs = [
  { path: '', label: 'Dashboard', element: <DashboardTab /> },
  // { path: 'users', label: 'Users and roles', element: <UsersTab /> },
  // { path: 'domains', label: 'Email domains', element: <DomainsTab /> },
  // { path: 'reports', label: 'Reports', element: <ReportsTab /> },
  // { path: 'cafeterias', label: 'Cafeteria menus', element: <CafeteriaAdmin /> },
  // { path: 'project-approvals', label: 'Project approvals', element: <ProjectApprovals /> },
  // { path: 'ride-approvals', label: 'Ride approvals', element: <RideApprovals /> },
];
