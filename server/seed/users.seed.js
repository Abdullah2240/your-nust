import bcrypt from 'bcryptjs';
import { User } from '../src/modules/users/user.model.js';
import { AllowedDomain, DEFAULT_DOMAINS } from '../src/modules/admin/domain.model.js';

export const SEED_PASSWORD = 'Password123!';

// Creates the allowed domains and the four dev users from the shared contract (section 3).
export default async function seedUsers() {
  await AllowedDomain.insertMany(DEFAULT_DOMAINS.map((domain) => ({ domain })));
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
  const base = { passwordHash, batch: '2024' };
  const [admin, ayesha, bilal, unverified] = await User.create([
    { ...base, name: 'Site Admin', email: 'admin@seecs.edu.pk', department: 'SEECS', role: 'admin', isVerified: true },
    { ...base, name: 'Ayesha Khan', email: 'ayesha@seecs.edu.pk', department: 'SEECS', isVerified: true, skills: ['React', 'UI/UX', 'Node.js'], phone: '03001234567' },
    { ...base, name: 'Bilal Ahmed', email: 'bilal@smme.edu.pk', department: 'SMME', batch: '2023', isVerified: true, skills: ['Embedded C', 'PCB', 'Python'] },
    { ...base, name: 'Unverified Student', email: 'unverified@seecs.edu.pk', department: 'SEECS', isVerified: false },
  ]);
  return { admin, ayesha, bilal, unverified };
}
