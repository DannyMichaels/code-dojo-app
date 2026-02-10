import { Router } from 'express';
import auth from '../middleware/auth.js';
import { getDashboardProgress, getSkillProgress } from '../controllers/progress.js';

const router = Router();

router.use(auth);

router.get('/', getDashboardProgress);
router.get('/:skillId', getSkillProgress);

export default router;
