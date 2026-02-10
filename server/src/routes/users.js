import { Router } from 'express';
import { getPublicProfile, getPublicSkills } from '../controllers/users.js';

const router = Router();

router.get('/:username', getPublicProfile);
router.get('/:username/skills', getPublicSkills);

export default router;
