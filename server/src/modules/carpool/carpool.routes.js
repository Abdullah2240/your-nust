import { Router } from 'express';
import { asyncHandler } from '../../lib/http.js';
import { requireRole, requireVerified } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as c from './carpool.controller.js';
import * as v from './ride.validation.js';

const router = Router();

// Carpool is for verified members only (shared contract section 1).
router.get('/', requireVerified, validate(v.listRidesSchema, 'query'), asyncHandler(c.listRides));
router.get('/mine', requireVerified, validate(v.pageSchema, 'query'), asyncHandler(c.myRides));
router.get('/admin/pending', requireRole('admin'), validate(v.pageSchema, 'query'), asyncHandler(c.pendingRides));
router.get('/:id', requireVerified, asyncHandler(c.getRide));
router.post('/', requireVerified, validate(v.createRideSchema), asyncHandler(c.createRide));
router.patch('/:id/approval', requireRole('admin'), validate(v.rideApprovalSchema), asyncHandler(c.decideRide));
router.patch('/:id', requireVerified, validate(v.updateRideSchema), asyncHandler(c.updateRide));

export default router;
