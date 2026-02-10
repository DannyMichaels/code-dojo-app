import UserSkill from '../models/UserSkill.js';
import Session from '../models/Session.js';
import BeltHistory from '../models/BeltHistory.js';
import { applyTimeDecay, checkBeltAdvancement, BELT_ORDER } from '../services/masteryCalc.js';

// GET /api/progress — Cross-skill dashboard summary
export async function getDashboardProgress(req, res, next) {
  try {
    const skills = await UserSkill.find({ userId: req.userId })
      .populate('skillCatalogId', 'name slug icon')
      .lean();

    const totalSessions = await Session.countDocuments({ userId: req.userId });
    const completedSessions = await Session.countDocuments({
      userId: req.userId,
      status: 'completed',
    });

    const skillSummaries = skills.map(skill => {
      const concepts = skill.concepts || {};
      let totalMastery = 0;
      let conceptCount = 0;

      for (const [, data] of Object.entries(concepts)) {
        totalMastery += applyTimeDecay(data);
        conceptCount++;
      }

      return {
        _id: skill._id,
        name: skill.skillCatalogId?.name || 'Unknown',
        slug: skill.skillCatalogId?.slug || '',
        currentBelt: skill.currentBelt,
        conceptCount,
        avgMastery: conceptCount > 0 ? Math.round((totalMastery / conceptCount) * 100) : 0,
        assessmentAvailable: skill.assessmentAvailable,
      };
    });

    res.json({
      progress: {
        totalSkills: skills.length,
        totalSessions,
        completedSessions,
        skills: skillSummaries,
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/progress/:skillId/belt-info — Belt advancement details
export async function getBeltInfo(req, res, next) {
  try {
    const skill = await UserSkill.findOne({
      _id: req.params.skillId,
      userId: req.userId,
    });

    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    const sessionCount = await Session.countDocuments({
      skillId: skill._id,
      userId: req.userId,
      status: { $ne: 'abandoned' },
    });

    const advancement = checkBeltAdvancement(skill, sessionCount);
    const currentIdx = BELT_ORDER.indexOf(skill.currentBelt);

    res.json({
      beltInfo: {
        currentBelt: skill.currentBelt,
        nextBelt: advancement.nextBelt,
        eligible: advancement.eligible,
        beltOrder: BELT_ORDER,
        currentBeltIndex: currentIdx,
        details: advancement.details,
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/progress/:skillId — Detailed skill progress
export async function getSkillProgress(req, res, next) {
  try {
    const skill = await UserSkill.findOne({
      _id: req.params.skillId,
      userId: req.userId,
    }).populate('skillCatalogId', 'name slug icon').lean();

    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    const sessionCount = await Session.countDocuments({
      skillId: skill._id,
      userId: req.userId,
    });

    const recentSessions = await Session.find({
      skillId: skill._id,
      userId: req.userId,
    })
      .select('date type status evaluation observations')
      .sort({ date: -1 })
      .limit(10)
      .lean();

    const beltHistory = await BeltHistory.find({ userSkillId: skill._id })
      .sort({ achievedAt: 1 })
      .lean();

    // Compute per-concept mastery
    const concepts = skill.concepts || {};
    const conceptDetails = Object.entries(concepts).map(([name, data]) => ({
      name,
      mastery: Math.round(applyTimeDecay(data) * 100),
      exposureCount: data.exposureCount || 0,
      streak: data.streak || 0,
      contexts: data.contexts || [],
      beltLevel: data.beltLevel || 'white',
      lastSeen: data.lastSeen,
    }));

    res.json({
      progress: {
        skill: {
          name: skill.skillCatalogId?.name,
          slug: skill.skillCatalogId?.slug,
          currentBelt: skill.currentBelt,
          assessmentAvailable: skill.assessmentAvailable,
        },
        sessionCount,
        recentSessions,
        beltHistory,
        concepts: conceptDetails,
        reinforcementQueue: skill.reinforcementQueue || [],
      },
    });
  } catch (err) {
    next(err);
  }
}
