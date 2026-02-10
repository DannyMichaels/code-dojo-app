import BeltHistory from '../models/BeltHistory.js';
import UserSkill from '../models/UserSkill.js';
import SkillCatalog from '../models/SkillCatalog.js';

// GET /api/belt-history/:userSkillId — Own belt timeline
export async function getBeltTimeline(req, res, next) {
  try {
    const { userSkillId } = req.params;

    // Verify ownership
    const skill = await UserSkill.findOne({ _id: userSkillId, userId: req.userId });
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    const history = await BeltHistory.find({ userSkillId })
      .sort({ achievedAt: 1 })
      .lean();

    res.json({ history });
  } catch (err) {
    next(err);
  }
}

// GET /api/belt-history/stats/:slug — Anonymized aggregate stats
export async function getBeltStats(req, res, next) {
  try {
    const catalog = await SkillCatalog.findOne({ slug: req.params.slug }).lean();
    if (!catalog) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    const totalStudents = await UserSkill.countDocuments({ skillCatalogId: catalog._id });

    // Count promotions in the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentPromotions = await BeltHistory.countDocuments({
      skillCatalogId: catalog._id,
      achievedAt: { $gte: thirtyDaysAgo },
      fromBelt: { $ne: null },
    });

    // Get belt distribution
    const beltDistribution = await UserSkill.aggregate([
      { $match: { skillCatalogId: catalog._id } },
      { $group: { _id: '$currentBelt', count: { $sum: 1 } } },
    ]);

    res.json({
      stats: {
        totalStudents,
        recentPromotions,
        beltDistribution: beltDistribution.reduce((acc, b) => {
          acc[b._id] = b.count;
          return acc;
        }, {}),
      },
    });
  } catch (err) {
    next(err);
  }
}
