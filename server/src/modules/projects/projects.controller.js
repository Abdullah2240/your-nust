import mongoose from 'mongoose';
import { HttpError, ok, paginate } from '../../lib/http.js';
import { escapeRegex } from '../../lib/regex.js';
import { notify, notifyAdmins } from '../notifications/notify.js';
import { Project } from './project.model.js';
import { isOwnerOrAdmin, toProjectJSON } from './project.view.js';

const PUBLIC = { approval: 'approved', isRemoved: false };

async function findProject(id) {
  if (!mongoose.isValidObjectId(id)) return null;
  return Project.findById(id).populate('owner');
}

// GET /api/projects  (public: approved and not removed only)
export async function listProjects(req, res) {
  const { skill, department, status, minTeam, maxTeam, q, page, limit } = req.query;
  const filter = { ...PUBLIC };
  if (skill.length) filter.skillsKey = { $in: skill.map((s) => s.toLowerCase()) };
  if (department) filter.department = department;
  if (status) filter.status = status;
  if (minTeam || maxTeam) {
    filter.teamSize = {};
    if (minTeam) filter.teamSize.$gte = minTeam;
    if (maxTeam) filter.teamSize.$lte = maxTeam;
  }
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ title: rx }, { description: rx }, { skills: rx }];
  }
  const result = await paginate(Project.find(filter).sort({ createdAt: -1 }).populate('owner'), { page, limit });
  ok(res, { ...result, items: result.items.map((p) => toProjectJSON(p, req.user)) });
}

// GET /api/projects/skills  (distinct skills on approved projects, for the filter sidebar)
export async function listSkills(_req, res) {
  const all = await Project.distinct('skills', PUBLIC);
  const seen = new Map();
  for (const s of all) if (!seen.has(s.toLowerCase())) seen.set(s.toLowerCase(), s);
  ok(res, [...seen.values()].sort((a, b) => a.localeCompare(b)));
}

// GET /api/projects/mine  (every approval state, including removed)
export async function myProjects(req, res) {
  const { page, limit } = req.query;
  const result = await paginate(Project.find({ owner: req.user._id }).sort({ createdAt: -1 }).populate('owner'), { page, limit });
  ok(res, { ...result, items: result.items.map((p) => toProjectJSON(p, req.user)) });
}

// GET /api/projects/:id
export async function getProject(req, res) {
  const project = await findProject(req.params.id);
  const visible = project && (isOwnerOrAdmin(project, req.user) || (project.approval === 'approved' && !project.isRemoved));
  if (!visible) throw new HttpError(404, 'NOT_FOUND', 'That project does not exist or is no longer available.');
  ok(res, toProjectJSON(project, req.user));
}

// POST /api/projects  (verified members; starts as pending)
export async function createProject(req, res) {
  const project = await Project.create({ ...req.body, owner: req.user._id, currentMembers: 1, approval: 'pending' });
  await notifyAdmins({
    type: 'admin_queue',
    title: 'New project waiting for approval',
    body: `"${project.title}" by ${req.user.name}`,
    link: '/admin/project-approvals',
  });
  await project.populate('owner');
  ok(res, toProjectJSON(project, req.user), 201);
}

// PATCH /api/projects/:id  (owner only)
export async function updateProject(req, res) {
  const project = await findProject(req.params.id);
  if (!project || project.isRemoved) throw new HttpError(404, 'NOT_FOUND', 'That project does not exist.');
  if (String(project.owner._id) !== String(req.user._id)) throw new HttpError(403, 'FORBIDDEN', 'Only the owner can edit this project.');

  const changes = req.body;
  const keys = Object.keys(changes);
  const allowed = project.approval === 'approved' ? ['status', 'teamSize'] : ['title', 'description', 'skills', 'department', 'teamSize'];
  const bad = keys.filter((k) => !allowed.includes(k));
  if (bad.length) {
    const message =
      project.approval === 'approved'
        ? 'After approval you can only change the status and the team size.'
        : 'You cannot change that on an unapproved project.';
    throw new HttpError(400, 'VALIDATION', message, Object.fromEntries(bad.map((k) => [k, message])));
  }

  const newSize = changes.teamSize ?? project.teamSize;
  if (newSize < project.currentMembers) {
    throw new HttpError(400, 'VALIDATION', 'Team size is lower than the current members.', {
      teamSize: `You already have ${project.currentMembers} members.`,
    });
  }
  const newStatus = changes.status ?? project.status;
  if (newStatus === 'Open' && project.currentMembers >= newSize) {
    throw new HttpError(400, 'VALIDATION', 'The team is full. Increase the team size first.', {
      status: 'The team is full. Increase the team size first.',
    });
  }

  Object.assign(project, changes);
  const wasRejected = project.approval === 'rejected';
  if (wasRejected) {
    project.approval = 'pending';
    project.rejectionReason = '';
  }
  await project.save();
  if (wasRejected) {
    await notifyAdmins({
      type: 'admin_queue',
      title: 'A project was edited and needs another look',
      body: `"${project.title}" by ${req.user.name}`,
      link: '/admin/project-approvals',
    });
  }
  ok(res, toProjectJSON(project, req.user));
}

// GET /api/projects/admin/pending  (admin, oldest first)
export async function pendingProjects(req, res) {
  const { page, limit } = req.query;
  const result = await paginate(
    Project.find({ approval: 'pending', isRemoved: false }).sort({ createdAt: 1 }).populate('owner'),
    { page, limit },
  );
  ok(res, { ...result, items: result.items.map((p) => toProjectJSON(p, req.user)) });
}

// PATCH /api/projects/:id/approval  (admin)
export async function decideProject(req, res) {
  const project = await findProject(req.params.id);
  if (!project || project.isRemoved) throw new HttpError(404, 'NOT_FOUND', 'That project does not exist.');
  if (project.approval !== 'pending') throw new HttpError(409, 'CONFLICT', 'This project has already been reviewed.');

  const { decision, reason } = req.body;
  project.approval = decision;
  project.rejectionReason = decision === 'rejected' ? reason : '';
  await project.save();

  await notify({
    userId: project.owner._id,
    type: decision === 'approved' ? 'post_approved' : 'post_rejected',
    title: decision === 'approved' ? 'Your project is live' : `Your project was not approved: ${reason}`.slice(0, 190),
    body: decision === 'approved' ? `"${project.title}" is now visible to everyone.` : `"${project.title}": ${reason}`,
    link: `/projects/${project.id}`,
  });
  ok(res, toProjectJSON(project, req.user));
}
