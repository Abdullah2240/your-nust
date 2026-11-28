import { Router } from 'express';
import { asyncHandler } from '../../lib/http.js';
import { requireRole, requireVerified } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as c from './projects.controller.js';
import * as v from './project.validation.js';

const router = Router();

// Fixed paths must come before '/:id'.
router.get('/', validate(v.listProjectsSchema, 'query'), asyncHandler(c.listProjects));
router.get('/skills', asyncHandler(c.listSkills));
router.get('/mine', requireVerified, validate(v.mineSchema, 'query'), asyncHandler(c.myProjects));
router.get('/admin/pending', requireRole('admin'), validate(v.mineSchema, 'query'), asyncHandler(c.pendingProjects));
router.get('/:id', asyncHandler(c.getProject));
router.post('/', requireVerified, validate(v.createProjectSchema), asyncHandler(c.createProject));
router.patch('/:id/approval', requireRole('admin'), validate(v.approvalSchema), asyncHandler(c.decideProject));
router.patch('/:id', requireVerified, validate(v.updateProjectSchema), asyncHandler(c.updateProject));

export default router;
