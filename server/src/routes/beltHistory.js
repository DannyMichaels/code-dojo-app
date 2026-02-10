import { Router } from 'express';
import auth from '../middleware/auth.js';
import { getBeltTimeline, getBeltStats } from '../controllers/beltHistory.js';

const router = Router();

// Public stats
router.get('/stats/:slug', getBeltStats);

// Authenticated — own belt timeline
router.get('/:userSkillId', auth, getBeltTimeline);

export default router;
