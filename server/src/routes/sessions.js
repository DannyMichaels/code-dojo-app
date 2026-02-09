import { Router } from 'express';
import auth from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { createSessionSchema, sendMessageSchema } from '../schemas/sessions.js';
import { listSessions, createSession, getSession, sendMessage } from '../controllers/sessions.js';

const router = Router({ mergeParams: true });

router.use(auth);

router.get('/', listSessions);
router.post('/', validate(createSessionSchema), createSession);
router.get('/:sid', getSession);
router.post('/:sid/messages', validate(sendMessageSchema), sendMessage);

export default router;
