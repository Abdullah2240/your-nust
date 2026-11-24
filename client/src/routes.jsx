// Client route registry. Each part ONLY uncomments its own lines (shared contract section 5.2).
import { lazy } from 'react';
import { routes as authRoutes } from './modules/auth/routes.jsx';
import { routes as profileRoutes } from './modules/profile/routes.jsx';
import { routes as notificationRoutes } from './modules/notifications/routes.jsx';
import { routes as adminRoutes } from './modules/admin/routes.jsx';
import { routes as staticRoutes } from './modules/static/routes.jsx';
import { NotFound } from './modules/static/StaticPages.jsx';
// import { routes as homeRoutes } from './modules/home/routes.jsx';             // Part B (Saniya)
// import { routes as cafeteriaRoutes } from './modules/cafeterias/routes.jsx';  // Part B (Saniya)
// import { routes as lostFoundRoutes } from './modules/lostfound/routes.jsx';   // Part B (Saniya)
// import { routes as projectRoutes } from './modules/projects/routes.jsx';      // Part C (Anosh)
// import { routes as carpoolRoutes } from './modules/carpool/routes.jsx';       // Part C (Anosh)
// import { routes as requestRoutes } from './modules/requests/routes.jsx';      // Part C (Anosh)

const UiKit = lazy(() => import('./modules/dev/UiKit.jsx'));

function HomePlaceholder() {
  return (
    <div className="wrap body">
      <h1>Your NUST</h1>
      <p className="muted">Home page: built by Saniya (task B10).</p>
    </div>
  );
}

export const routes = [
  { path: '/', element: <HomePlaceholder /> }, // Part B: delete this line when you uncomment homeRoutes
  ...authRoutes,
  ...profileRoutes,
  ...notificationRoutes,
  ...adminRoutes,
  ...staticRoutes,
  // ...homeRoutes,
  // ...cafeteriaRoutes,
  // ...lostFoundRoutes,
  // ...projectRoutes,
  // ...carpoolRoutes,
  // ...requestRoutes,
  ...(import.meta.env.DEV ? [{ path: '/dev/ui', element: <UiKit /> }] : []),
  { path: '*', element: <NotFound /> },
];
