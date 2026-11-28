// Turns a Project document into the JSON we send out. Owner is always a public profile (no email or phone).
import { toPublicProfile } from '../users/user.utils.js';

export function isOwnerOrAdmin(project, user) {
  if (!user) return false;
  const ownerId = String(project.owner?._id ?? project.owner);
  return ownerId === String(user._id) || user.role === 'admin';
}

export function toProjectJSON(project, viewer) {
  const mine = isOwnerOrAdmin(project, viewer);
  const out = {
    id: String(project._id),
    title: project.title,
    description: project.description,
    skills: project.skills,
    department: project.department,
    teamSize: project.teamSize,
    currentMembers: project.currentMembers,
    status: project.status,
    approval: project.approval,
    owner: toPublicProfile(project.owner),
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
  if (mine) {
    out.rejectionReason = project.rejectionReason || '';
    out.isRemoved = !!project.isRemoved;
  }
  return out;
}
