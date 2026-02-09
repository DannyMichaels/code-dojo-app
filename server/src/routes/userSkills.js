import { Router } from 'express';
import auth from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { startSkillSchema, updatePrivacySchema } from '../schemas/skills.js';
import {
  listUserSkills,
  startSkill,
  getUserSkill,
  updatePrivacy,
  deleteUserSkill,
} from '../controllers/skills.js';

const router = Router();

router.use(auth);

router.get('/', listUserSkills);
router.post('/', validate(startSkillSchema), startSkill);
router.get('/:id', getUserSkill);
router.put('/:id/privacy', validate(updatePrivacySchema), updatePrivacy);
router.delete('/:id', deleteUserSkill);

export default router;
