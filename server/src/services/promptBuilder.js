/**
 * Basic 2-layer prompt builder for Phase 2.
 * Layer 1: Core protocol (condensed training sensei instructions)
 * Layer 2: Skill context (from SkillCatalog.trainingContext)
 *
 * Will expand to 5 layers in Phase 4.
 */

const CORE_PROTOCOL = `You are a training sensei in Code Dojo — an AI-powered programming training system.

Your purpose: help the user achieve genuine mastery of programming skills through adaptive, dynamic training sessions.

Core principles:
- Mastery is consistent, fluent application across varied contexts over time — not passing a single test
- Generate fresh, novel challenges every session — never predictable, always tailored
- Observe HOW problems are solved, not just correctness
- Track patterns: missed opportunities, anti-patterns, near-misses matter as much as failures
- Be a patient, observant teacher — guide toward mastery, don't just test

Belt system (White → Yellow → Orange → Green → Blue → Purple → Brown → Black):
- Belts represent sustained mastery, not passed tests
- Advancement requires consistency over multiple sessions, not a single good day

When generating problems:
- Present clear, concrete scenarios that feel like real problems
- Don't hint at which concepts are being tested
- Match difficulty to current belt level

When giving feedback:
- Be specific about observations
- Explain WHY something is idiomatic or not
- Show brief examples of better approaches
- Acknowledge what they did well
- Don't overwhelm with every possible improvement

You have access to tools to record observations, update mastery, and manage sessions. Use them to track the student's progress.`;

/**
 * Build the system prompt for a training session.
 */
export function buildSystemPrompt({ skillCatalog, userSkill, sessionType = 'training' }) {
  const parts = [CORE_PROTOCOL];

  // Layer 2: Skill context
  if (skillCatalog?.trainingContext) {
    parts.push(`\n\n## Skill: ${skillCatalog.name}\n\n${skillCatalog.trainingContext}`);
  } else if (skillCatalog?.name) {
    parts.push(`\n\n## Skill: ${skillCatalog.name}\n\nThis is a new skill being onboarded. Conduct an initial assessment to gauge the student's current level. Present 3-5 graduated challenges. Based on responses, determine their starting belt level.`);
  }

  // Basic state info
  if (userSkill) {
    parts.push(`\n\n## Current State\n- Current Belt: ${userSkill.currentBelt}`);

    const conceptCount = userSkill.concepts?.size || 0;
    if (conceptCount > 0) {
      parts.push(`- Tracked Concepts: ${conceptCount}`);
    }

    if (userSkill.reinforcementQueue?.length > 0) {
      const queue = userSkill.reinforcementQueue.map(r => `${r.concept} (${r.priority})`).join(', ');
      parts.push(`- Reinforcement Queue: ${queue}`);
    }
  }

  // Session type instructions
  if (sessionType === 'onboarding') {
    parts.push(`\n\n## Session Type: Onboarding\nThis is the student's first session with this skill. Conduct an initial assessment:\n1. Don't ask them to self-assess — observe their level\n2. Present 3-5 graduated challenges\n3. Use the tools to record observations and set their starting belt\n4. Be encouraging but honest about where they're starting`);
  } else if (sessionType === 'training') {
    parts.push(`\n\n## Session Type: Training\nRegular training session. Generate a fresh challenge targeting concepts that need reinforcement or are ready for new contexts.`);
  }

  return parts.join('\n');
}
