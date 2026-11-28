// "My posts" tab registry (shared contract section 5.3). Each part ONLY uncomments its own lines.
// import MyLostItems from '../lostfound/MyLostItems.jsx'; // Part B (Saniya)
import MyProjects from '../projects/MyProjects.jsx';    // Part C (Anosh)
import MyRides from '../carpool/MyRides.jsx';           // Part C (Anosh)

export const myPostsTabs = [
  // { key: 'lostfound', label: 'Lost & Found', element: <MyLostItems /> }, // Part B
  { key: 'projects', label: 'Projects', element: <MyProjects /> },       // Part C
  { key: 'rides', label: 'Rides', element: <MyRides /> },                // Part C
];
