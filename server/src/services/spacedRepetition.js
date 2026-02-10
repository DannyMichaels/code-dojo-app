/**
 * Spaced repetition — prioritize concepts for next session.
 *
 * Priority order:
 * 1. Reinforcement queue (explicitly flagged by observations)
 * 2. Decayed concepts (mastery dropped due to time)
 * 3. Context gaps (concepts only seen in limited contexts)
 * 4. New concepts (ready to introduce at current belt level)
 */

import { applyTimeDecay, BELT_ORDER } from './masteryCalc.js';

/**
 * Get prioritized list of concepts to target in next session.
 * @param {Object} userSkill - the UserSkill document
 * @returns {Array<{ concept: string, reason: string, priority: string, mastery: number }>}
 */
export function getPrioritizedConcepts(userSkill) {
  const results = [];
  const concepts = userSkill.concepts || new Map();
  const queue = userSkill.reinforcementQueue || [];
  const currentBeltIdx = BELT_ORDER.indexOf(userSkill.currentBelt);

  // 1. Reinforcement queue items (highest priority)
  for (const item of queue) {
    results.push({
      concept: item.concept,
      reason: `reinforcement_queue (${item.priority})`,
      priority: item.priority === 'high' ? 'critical' : item.priority,
      mastery: getConceptMastery(concepts, item.concept),
    });
  }

  // 2. Decayed concepts
  for (const [name, data] of concepts) {
    if (isAlreadyQueued(results, name)) continue;

    const mastery = applyTimeDecay(data);
    const daysSince = data.lastSeen
      ? (Date.now() - new Date(data.lastSeen).getTime()) / (1000 * 60 * 60 * 24)
      : 999;

    // If mastery dropped significantly from stored value, it's decayed
    if (daysSince > 14 && mastery < 0.6 && data.exposureCount > 0) {
      results.push({
        concept: name,
        reason: `decayed (${daysSince.toFixed(0)} days, mastery ${(mastery * 100).toFixed(0)}%)`,
        priority: mastery < 0.3 ? 'high' : 'medium',
        mastery,
      });
    }
  }

  // 3. Context gaps — concepts seen in fewer than 3 contexts with decent mastery
  for (const [name, data] of concepts) {
    if (isAlreadyQueued(results, name)) continue;

    const mastery = applyTimeDecay(data);
    const contextCount = data.contexts?.length || 0;

    if (mastery >= 0.5 && contextCount < 3 && data.exposureCount >= 2) {
      results.push({
        concept: name,
        reason: `context_gap (${contextCount} contexts)`,
        priority: 'low',
        mastery,
      });
    }
  }

  // 4. Weak concepts — below threshold for current belt
  for (const [name, data] of concepts) {
    if (isAlreadyQueued(results, name)) continue;

    const beltIdx = BELT_ORDER.indexOf(data.beltLevel || 'white');
    if (beltIdx > currentBeltIdx) continue; // skip concepts above current belt

    const mastery = applyTimeDecay(data);
    if (mastery < 0.7 && data.exposureCount >= 1) {
      results.push({
        concept: name,
        reason: `weak (mastery ${(mastery * 100).toFixed(0)}%)`,
        priority: mastery < 0.4 ? 'high' : 'medium',
        mastery,
      });
    }
  }

  // Sort by priority weight
  const priorityWeight = { critical: 0, high: 1, medium: 2, low: 3 };
  results.sort((a, b) => (priorityWeight[a.priority] ?? 99) - (priorityWeight[b.priority] ?? 99));

  return results;
}

/**
 * Determine the optimal session type for the user's current state.
 */
export function suggestSessionType(userSkill, sessionCount) {
  const queue = userSkill.reinforcementQueue || [];
  const concepts = userSkill.concepts || new Map();

  if (concepts.size === 0) return 'onboarding';
  if (queue.filter(q => q.priority === 'high').length >= 3) return 'training'; // focused reinforcement
  if (userSkill.assessmentAvailable) return 'assessment';

  return 'training';
}

function getConceptMastery(concepts, name) {
  const key = name.toLowerCase().replace(/\s+/g, '_');
  const data = concepts.get(key) || concepts.get(name);
  if (!data) return 0;
  return applyTimeDecay(data);
}

function isAlreadyQueued(results, name) {
  const key = name.toLowerCase().replace(/\s+/g, '_');
  return results.some(r => r.concept === key || r.concept === name);
}
