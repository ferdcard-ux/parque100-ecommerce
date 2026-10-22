import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import activityController from '../controllers/activity.controller.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();
const activityLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas interacciones registradas.' },
});

router.post(
  '/activity/interactions',
  optionalAuth,
  activityLimiter,
  activityController.recordInteraction,
);

export default router;
