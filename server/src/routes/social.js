import { Router } from 'express';
import auth from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { followSchema } from '../schemas/social.js';
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  isFollowing,
  getFollowCounts,
} from '../controllers/social.js';

const router = Router();

router.post('/follow', auth, validate(followSchema), followUser);
router.delete('/follow/:userId', auth, unfollowUser);
router.get('/followers/:userId', auth, getFollowers);
router.get('/following/:userId', auth, getFollowing);
router.get('/is-following/:userId', auth, isFollowing);
router.get('/counts/:userId', auth, getFollowCounts);

export default router;
