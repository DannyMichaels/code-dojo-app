import { Router } from 'express';
import auth from '../middleware/auth.js';
import { getFollowingFeed, getForYouFeed } from '../controllers/feed.js';

const router = Router();

router.get('/following', auth, getFollowingFeed);
router.get('/for-you', auth, getForYouFeed);

export default router;
