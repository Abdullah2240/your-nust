// Shared enums. Keep in sync with client/src/lib/constants.js and the shared contract (section 4.6).
export const ROLES = ['member', 'admin'];
export const SCHOOLS = ['SEECS', 'SMME', 'SCME', 'SCEE', 'SNS', 'S3H', 'NBS', 'SADA', 'ASAB', 'Other'];
export const CAFETERIAS = ['C1', 'C2', 'C3', 'C4'];
export const FOOD_CATEGORIES = ['Breakfast', 'Rice', 'Mains', 'Breads', 'Fast food', 'Snacks', 'Desserts', 'Drinks'];
export const LOST_CATEGORIES = ['Electronics', 'Personal', 'Documents', 'Clothing', 'Other'];
export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const NOTIFICATION_TYPES = [
  'request_new', 'request_decision', 'post_approved', 'post_rejected', 'status_update', 'moderation', 'admin_queue',
];
export const REPORT_REASONS = ['spam', 'misleading', 'inappropriate', 'outdated', 'other'];
