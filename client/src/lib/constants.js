// Shared enums. Keep in sync with server/src/lib/constants.js and the shared contract (section 4.6).
export const SCHOOLS = ['SEECS', 'SMME', 'SCME', 'SCEE', 'SNS', 'S3H', 'NBS', 'SADA', 'ASAB', 'Other'];
export const CAFETERIAS = ['C1', 'C2', 'C3', 'C4'];
export const FOOD_CATEGORIES = ['Breakfast', 'Rice', 'Mains', 'Breads', 'Fast food', 'Snacks', 'Desserts', 'Drinks'];
export const LOST_CATEGORIES = ['Electronics', 'Personal', 'Documents', 'Clothing', 'Other'];
export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const REPORT_REASONS = [
  { value: 'spam', label: 'Spam or advertising' },
  { value: 'misleading', label: 'Misleading or false' },
  { value: 'inappropriate', label: 'Inappropriate or offensive' },
  { value: 'outdated', label: 'Outdated, no longer relevant' },
  { value: 'other', label: 'Something else' },
];
export const SKILL_SUGGESTIONS = [
  'React', 'Node.js', 'Python', 'Java', 'C++', 'Embedded C', 'PCB', 'ML', 'Data analysis', 'UI/UX', 'Figma',
  'Flutter', 'Android', 'MATLAB', 'CAD', 'SolidWorks', 'Writing', 'Marketing', 'Video editing', 'Public speaking',
];
