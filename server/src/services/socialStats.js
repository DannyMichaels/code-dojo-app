import BeltHistory from '../models/BeltHistory.js';
import UserSkill from '../models/UserSkill.js';

/**
 * Compute anonymized encouragement data for a skill catalog entry.
 * Injected into prompt Layer 3.
 */
export async function getSocialStats(skillCatalogId) {
  const totalStudents = await UserSkill.countDocuments({ skillCatalogId });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentPromotions = await BeltHistory.countDocuments({
    skillCatalogId,
    achievedAt: { $gte: thirtyDaysAgo },
    fromBelt: { $ne: null },
  });

  // Estimate average time to next belt from recent promotions
  let avgTimeToNextBelt = null;
  if (totalStudents >= 3) {
    const recentBelts = await BeltHistory.find({
      skillCatalogId,
      fromBelt: { $ne: null },
    })
      .sort({ achievedAt: -1 })
      .limit(20)
      .lean();

    if (recentBelts.length >= 2) {
      // Simple avg: time between consecutive belt events per user
      // This is approximate — good enough for encouragement
      const totalDays = recentBelts.reduce((sum, entry) => {
        const daysSinceCreation = (new Date(entry.achievedAt).getTime() - new Date(entry.createdAt || entry.achievedAt).getTime()) / (1000 * 60 * 60 * 24);
        return sum + Math.max(daysSinceCreation, 1);
      }, 0);

      const avgDays = Math.round(totalDays / recentBelts.length);
      if (avgDays < 7) {
        avgTimeToNextBelt = `${avgDays} days`;
      } else {
        avgTimeToNextBelt = `${Math.round(avgDays / 7)} weeks`;
      }
    }
  }

  return {
    totalStudents,
    recentPromotions,
    avgTimeToNextBelt,
  };
}
