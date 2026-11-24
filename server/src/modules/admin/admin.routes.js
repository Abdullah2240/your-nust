// Everything under /api/admin requires the admin role.
import { Router } from 'express';
import { asyncHandler } from '../../lib/http.js';
import { requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { decideReportSchema, listReportsSchema } from '../reports/report.validation.js';
import { decideReport, listReports } from './reports.admin.controller.js';
import { listUsers, listUsersSchema, roleSchema, setRole } from './users.admin.controller.js';
import { addDomain, deleteDomain, domainSchema, listDomains } from './domains.admin.controller.js';
import { getStats } from './stats.admin.controller.js';

const router = Router();
router.use(requireRole('admin'));

router.get('/stats', asyncHandler(getStats));

router.get('/reports', validate(listReportsSchema, 'query'), asyncHandler(listReports));
router.patch('/reports/:id', validate(decideReportSchema), asyncHandler(decideReport));

router.get('/users', validate(listUsersSchema, 'query'), asyncHandler(listUsers));
router.patch('/users/:id/role', validate(roleSchema), asyncHandler(setRole));

router.get('/domains', asyncHandler(listDomains));
router.post('/domains', validate(domainSchema), asyncHandler(addDomain));
router.delete('/domains/:id', asyncHandler(deleteDomain));

export default router;
