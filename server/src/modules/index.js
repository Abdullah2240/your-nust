// Route registry. Each part ONLY uncomments its own lines (shared contract section 4.3).
import authRoutes from './auth/auth.routes.js';
import userRoutes from './users/user.routes.js';
import notificationRoutes from './notifications/notification.routes.js';
import reportRoutes from './reports/report.routes.js';
import adminRoutes from './admin/admin.routes.js';
// import cafeteriaRoutes from './cafeterias/cafeterias.routes.js'; // Part B (Saniya)
// import lostFoundRoutes from './lostfound/lostfound.routes.js';   // Part B (Saniya)
// import projectRoutes from './projects/projects.routes.js';       // Part C (Anosh)
// import carpoolRoutes from './carpool/carpool.routes.js';         // Part C (Anosh)
// import requestRoutes from './requests/requests.routes.js';       // Part C (Anosh)

export function registerModules(app) {
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/admin', adminRoutes);
  // app.use('/api/cafeterias', cafeteriaRoutes);    // Part B
  // app.use('/api/lost-found', lostFoundRoutes);    // Part B
  // app.use('/api/projects', projectRoutes);        // Part C
  // app.use('/api/carpool', carpoolRoutes);         // Part C
  // app.use('/api/requests', requestRoutes);        // Part C
}
