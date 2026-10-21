import { Router } from 'express';
import siteAccessController from '../controllers/site-access.controller.js';
import { requireSiteAccessAuth } from '../middleware/auth.js';

const router = Router();

router.post('/site-access/login', siteAccessController.login);
router.get('/site-access/proxy-access', siteAccessController.proxyAccess);
router.get('/site-access/disclaimer/status', requireSiteAccessAuth, siteAccessController.status);
router.post('/site-access/disclaimer/accept', requireSiteAccessAuth, siteAccessController.acceptDisclaimer);
router.post('/site-access/logout', siteAccessController.logout);

export default router;
