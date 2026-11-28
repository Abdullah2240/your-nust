// Sample projects for development. Run with `npm run seed` while `npm run dev` is running.
import { Project } from '../src/modules/projects/project.model.js';
import { InterestRequest } from '../src/modules/requests/request.model.js';

export default async function seed({ users }) {
  // Make sure the request indexes exist again after the database was wiped.
  await InterestRequest.init();

  const owners = [users.ayesha, users.bilal];
  const base = [
    { title: 'Campus delivery app', description: 'Final year project: ordering food from C1 to C4 with delivery to the hostels. Ayesha is building the web app and needs help with the backend and a simple rider screen.', skills: ['React', 'Node.js', 'UI/UX'], department: 'SEECS', teamSize: 4, currentMembers: 2, status: 'Open', owner: 0 },
    { title: 'Line-follower robot for NERC 2027', description: 'Competition robot for the National Engineering Robotics Contest. We have the chassis and motors. Looking for help with firmware and the sensor PCB.', skills: ['Embedded C', 'PCB'], department: 'SMME', teamSize: 5, currentMembers: 3, status: 'Open', owner: 1 },
    { title: 'Student wellbeing chatbot', description: 'Research prototype that points students to campus counselling resources and study tips. Needs someone for the language model side and someone to write the content.', skills: ['Python', 'ML', 'Writing'], department: 'S3H', teamSize: 3, currentMembers: 1, status: 'Open', owner: 0 },
    { title: 'Hostel complaint tracker', description: 'A simple portal to log and follow up hostel maintenance issues, with a status page for each complaint. The team is complete for this semester.', skills: ['UI/UX', 'React'], department: 'NBS', teamSize: 4, currentMembers: 4, status: 'Closed', owner: 1 },
    { title: 'Solar-powered charging bench', description: 'Design and build a small solar charging bench for the area outside the library. Need a CAD person and someone comfortable with basic circuits.', skills: ['CAD', 'SolidWorks', 'PCB'], department: 'SMME', teamSize: 4, currentMembers: 1, status: 'Open', owner: 1 },
    { title: 'NUST events poster maker', description: 'A small tool that turns an event title, date and venue into a clean poster. Good for first-time web developers who want a real project to finish.', skills: ['React', 'Figma'], department: 'SEECS', teamSize: 3, currentMembers: 2, status: 'Open', owner: 0 },
  ].map(({ owner, ...p }) => ({ ...p, owner: owners[owner]._id, approval: 'approved' }));

  const pending = {
    title: 'Library seat finder', description: 'Students tap a button when they leave or take a seat, and everyone can see which floors have space. Needs a mobile-friendly front end and a way to keep data fresh.',
    skills: ['Flutter', 'Android'], department: 'SEECS', teamSize: 3, currentMembers: 1, status: 'Open', owner: users.bilal._id, approval: 'pending',
  };

  const created = await Project.create([...base, pending]);
  return created.length;
}
