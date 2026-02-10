import Activity from '../models/Activity.js';
import User from '../models/User.js';

/**
 * Fire-and-forget activity emissions.
 * Errors are logged but never thrown to avoid breaking the caller.
 */

export async function emitSkillStarted(userId, { skillName, skillSlug }) {
  try {
    await Activity.create({
      userId,
      type: 'skill_started',
      data: { skillName, skillSlug },
    });
  } catch (err) {
    console.error('Failed to emit skill_started activity:', err.message);
  }
}

export async function emitBeltPromotion(userId, { skillName, skillSlug, fromBelt, toBelt }) {
  try {
    await Activity.create({
      userId,
      type: 'belt_promotion',
      data: { skillName, skillSlug, fromBelt, toBelt },
    });
  } catch (err) {
    console.error('Failed to emit belt_promotion activity:', err.message);
  }
}

export async function emitAssessmentPassed(userId, { skillName, skillSlug, belt }) {
  try {
    await Activity.create({
      userId,
      type: 'assessment_passed',
      data: { skillName, skillSlug, belt },
    });
  } catch (err) {
    console.error('Failed to emit assessment_passed activity:', err.message);
  }
}

const STREAK_MILESTONES = [7, 14, 30, 60, 100];

export async function checkAndEmitStreakMilestone(userId) {
  try {
    const user = await User.findById(userId).select('currentStreak').lean();
    if (!user) return;

    const streak = user.currentStreak;
    if (!STREAK_MILESTONES.includes(streak)) return;

    // Deduplicate: check if we already emitted this milestone
    const existing = await Activity.findOne({
      userId,
      type: 'streak_milestone',
      'data.streakDays': streak,
    }).lean();

    if (!existing) {
      await Activity.create({
        userId,
        type: 'streak_milestone',
        data: { streakDays: streak },
      });
    }
  } catch (err) {
    console.error('Failed to check/emit streak milestone:', err.message);
  }
}
