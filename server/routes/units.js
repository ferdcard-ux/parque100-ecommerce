import { Router } from 'express';
import unitController from '../controllers/unit.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/units', unitController.list);
router.post('/units', requireAuth, requireRole('admin'), unitController.create);
router.put('/units/:id', requireAuth, requireRole('admin'), unitController.update);
router.delete('/units/:id', requireAuth, requireRole('admin'), unitController.remove);

export default router;
