import { Router } from 'express';
import { asyncHandler } from '../../lib/http.js';
import { requireVerified } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import * as c from './requests.controller.js';
import * as v from './request.validation.js';

const router = Router();

router.post('/', requireVerified, validate(v.createRequestSchema), asyncHandler(c.createRequest));
router.get('/incoming', requireVerified, validate(v.listRequestsSchema, 'query'), asyncHandler(c.incoming));
router.get('/outgoing', requireVerified, validate(v.listRequestsSchema, 'query'), asyncHandler(c.outgoing));
router.get('/:id/contact', requireVerified, asyncHandler(c.requestContact));
router.patch('/:id/withdraw', requireVerified, asyncHandler(c.withdrawRequest));
router.patch('/:id', requireVerified, validate(v.decideRequestSchema), asyncHandler(c.decideRequest));

export default router;
