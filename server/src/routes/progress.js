import { Router } from 'express';
import auth from '../middleware/auth.js';
import { getDashboardProgress, getBeltInfo, getBeltAnalysis, manualPromote, getSkillProgress } from '../controllers/progress.js';

const router = Router();

router.use(auth);

router.get('/', getDashboardProgress);
router.get('/:skillId/belt-info', getBeltInfo);
router.get('/:skillId/belt-analysis', getBeltAnalysis);
router.post('/:skillId/promote', manualPromote);
router.get('/:skillId', getSkillProgress);

export default router;
