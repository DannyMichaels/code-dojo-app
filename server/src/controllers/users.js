import User from '../models/User.js';
import UserSkill from '../models/UserSkill.js';

// GET /api/users/:username — Public profile
export async function getPublicProfile(req, res, next) {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('username name bio avatarUrl created')
      .lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get public skill count
    const skillCount = await UserSkill.countDocuments({
      userId: user._id,
      isPublic: true,
    });

    res.json({
      profile: {
        ...user,
        skillCount,
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/users/:username/skills — Public skills (isPublic only)
export async function getPublicSkills(req, res, next) {
  try {
    const user = await User.findOne({ username: req.params.username }).select('_id').lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const skills = await UserSkill.find({
      userId: user._id,
      isPublic: true,
    })
      .populate('skillCatalogId', 'name slug icon')
      .select('skillCatalogId currentBelt createdAt')
      .lean();

    res.json({ skills });
  } catch (err) {
    next(err);
  }
}
