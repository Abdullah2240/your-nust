import { Router } from 'express';
import { asyncHandler } from '../../lib/http.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as c from './user.controller.js';
import { updateMeSchema } from './user.validation.js';

const router = Router();
router.patch('/me', requireAuth, validate(updateMeSchema), asyncHandler(c.updateMe));
router.get('/:id', asyncHandler(c.getProfile));

export default router;
