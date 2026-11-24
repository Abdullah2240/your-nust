import { Router } from 'express';
import { asyncHandler } from '../../lib/http.js';
import { requireVerified } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createReport } from './report.controller.js';
import { createReportSchema } from './report.validation.js';

const router = Router();
router.post('/', requireVerified, validate(createReportSchema), asyncHandler(createReport));

export default router;
