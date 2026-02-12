import { Router } from 'express';
import { register, login, getMe, updateMe, uploadAvatar, deleteMe } from '../controllers/auth.js';
import auth from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { registerSchema, loginSchema, updateProfileSchema } from '../schemas/auth.js';
import { avatarSchema } from '../schemas/social.js';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/me', auth, getMe);
router.put('/me', auth, validate(updateProfileSchema), updateMe);
router.put('/me/avatar', auth, validate(avatarSchema), uploadAvatar);
router.delete('/me', auth, deleteMe);

export default router;
