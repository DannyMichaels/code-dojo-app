import { Router } from 'express';
import auth from '../middleware/auth.js';
import { searchUsers, getPublicProfile, getPublicSkills } from '../controllers/users.js';

const router = Router();

router.get('/search', auth, searchUsers);
router.get('/:username', getPublicProfile);
router.get('/:username/skills', getPublicSkills);

export default router;
