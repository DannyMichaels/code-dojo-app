import Follow from '../models/Follow.js';
import User from '../models/User.js';

// POST /api/social/follow
export async function followUser(req, res, next) {
  try {
    const { userId: targetId } = req.body;

    if (targetId === req.userId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const target = await User.findById(targetId).select('_id').lean();
    if (!target) {
      return res.status(404).json({ error: 'User not found' });
    }

    try {
      await Follow.create({ followerId: req.userId, followingId: targetId });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ error: 'Already following this user' });
      }
      throw err;
    }

    res.status(201).json({ message: 'Followed' });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/social/follow/:userId
export async function unfollowUser(req, res, next) {
  try {
    const doc = await Follow.findOneAndDelete({
      followerId: req.userId,
      followingId: req.params.userId,
    });

    if (!doc) {
      return res.status(404).json({ error: 'Not following this user' });
    }

    res.json({ message: 'Unfollowed' });
  } catch (err) {
    next(err);
  }
}

// GET /api/social/followers/:userId?page=
export async function getFollowers(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [followers, total] = await Promise.all([
      Follow.find({ followingId: req.params.userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('followerId', 'username name avatar')
        .lean(),
      Follow.countDocuments({ followingId: req.params.userId }),
    ]);

    res.json({
      followers: followers.map(f => f.followerId),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/social/following/:userId?page=
export async function getFollowing(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [following, total] = await Promise.all([
      Follow.find({ followerId: req.params.userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('followingId', 'username name avatar')
        .lean(),
      Follow.countDocuments({ followerId: req.params.userId }),
    ]);

    res.json({
      following: following.map(f => f.followingId),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/social/is-following/:userId
export async function isFollowing(req, res, next) {
  try {
    const doc = await Follow.findOne({
      followerId: req.userId,
      followingId: req.params.userId,
    }).lean();

    res.json({ isFollowing: !!doc });
  } catch (err) {
    next(err);
  }
}

// GET /api/social/counts/:userId
export async function getFollowCounts(req, res, next) {
  try {
    const [followerCount, followingCount] = await Promise.all([
      Follow.countDocuments({ followingId: req.params.userId }),
      Follow.countDocuments({ followerId: req.params.userId }),
    ]);

    res.json({ followerCount, followingCount });
  } catch (err) {
    next(err);
  }
}
