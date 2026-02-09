/**
 * 5-layer prompt builder for training sessions.
 *
 * Layer 1: Core Protocol (from trainingProtocol.js)
 * Layer 2: Skill Context (from SkillCatalog.trainingContext)
 * Layer 3: Current State (concepts, reinforcement queue, social stats)
 * Layer 4: Session Instructions (by type: onboarding, training, assessment, kata)
 * Layer 5: Output Format (tool usage instructions)
 */

import { TRAINING_PROTOCOL } from '../prompts/trainingProtocol.js';
import { computeMastery, BELT_ORDER } from './masteryCalc.js';
import { getPrioritizedConcepts } from './spacedRepetition.js';

/**
 * Build the full system prompt for a training session.
 */
export function buildSystemPrompt({ skillCatalog, userSkill, sessionType = 'training', socialStats = null }) {
  const parts = [];

  // Layer 1: Core Protocol
  parts.push(TRAINING_PROTOCOL);

  // Layer 2: Skill Context
  parts.push(buildSkillContext(skillCatalog));

  // Layer 3: Current State
  parts.push(buildCurrentState(userSkill, socialStats));

  // Layer 4: Session Instructions
  parts.push(buildSessionInstructions(sessionType, userSkill));

  // Layer 5: Output Format
  parts.push(buildOutputFormat(sessionType));

  return parts.filter(Boolean).join('\n\n');
}

function buildSkillContext(skillCatalog) {
  if (!skillCatalog) return '';

  if (skillCatalog.trainingContext) {
    return `## Skill: ${skillCatalog.name}\n\n${skillCatalog.trainingContext}`;
  }

  return `## Skill: ${skillCatalog.name}\n\nThis is a new skill being onboarded. No training context has been established yet. You will need to generate one during the onboarding session using the set_training_context tool.`;
}

function buildCurrentState(userSkill, socialStats) {
  if (!userSkill) return '';

  const lines = ['## Current Student State'];
  lines.push(`- Current Belt: **${userSkill.currentBelt}**`);
  lines.push(`- Assessment Available: ${userSkill.assessmentAvailable ? 'Yes' : 'No'}`);

  const concepts = userSkill.concepts || new Map();
  if (concepts.size > 0) {
    lines.push(`- Tracked Concepts: ${concepts.size}`);

    // Show concept summary grouped by mastery level
    const strong = [];
    const developing = [];
    const weak = [];

    for (const [name, data] of concepts) {
      const mastery = computeMastery(data);
      const label = `${name} (${(mastery * 100).toFixed(0)}%)`;
      if (mastery >= 0.8) strong.push(label);
      else if (mastery >= 0.5) developing.push(label);
      else weak.push(label);
    }

    if (strong.length) lines.push(`- Strong: ${strong.join(', ')}`);
    if (developing.length) lines.push(`- Developing: ${developing.join(', ')}`);
    if (weak.length) lines.push(`- Weak: ${weak.join(', ')}`);
  }

  // Reinforcement queue
  const queue = userSkill.reinforcementQueue || [];
  if (queue.length > 0) {
    const queueStr = queue.map(r => `${r.concept} (${r.priority})`).join(', ');
    lines.push(`- Reinforcement Queue: ${queueStr}`);
  }

  // Prioritized concepts for this session
  try {
    const prioritized = getPrioritizedConcepts(userSkill);
    if (prioritized.length > 0) {
      lines.push('\n### Suggested Focus for This Session');
      for (const item of prioritized.slice(0, 5)) {
        lines.push(`- **${item.concept}**: ${item.reason}`);
      }
    }
  } catch {
    // Graceful degradation if spaced repetition fails
  }

  // Social stats (anonymized encouragement data)
  if (socialStats) {
    lines.push('\n### Community Context');
    if (socialStats.totalStudents) {
      lines.push(`- ${socialStats.totalStudents} students are learning this skill`);
    }
    if (socialStats.avgTimeToNextBelt) {
      lines.push(`- Average time to next belt: ${socialStats.avgTimeToNextBelt}`);
    }
    if (socialStats.recentPromotions) {
      lines.push(`- ${socialStats.recentPromotions} students promoted this month`);
    }
  }

  return lines.join('\n');
}

function buildSessionInstructions(sessionType, userSkill) {
  switch (sessionType) {
    case 'onboarding':
      return `## Session Type: Onboarding

This is the student's first session with this skill.

Instructions:
1. Welcome them briefly — don't be verbose
2. Do NOT ask them to self-assess their level — observe it through challenges
3. Present 3-5 graduated challenges, starting simple and increasing
4. After each response, use \`record_observation\` and \`update_mastery\` tools
5. Based on all responses, determine their starting belt level
6. Use \`set_training_context\` to save skill-specific training context (what makes code idiomatic, key concept areas, common anti-patterns, evaluation criteria)
7. Use \`complete_session\` when done
8. Be encouraging but honest about where they're starting`;

    case 'assessment':
      return `## Session Type: Belt Assessment

The student has requested a belt assessment. This is more rigorous than regular training.

Current belt: ${userSkill?.currentBelt || 'white'}
Testing readiness for: next belt

Instructions:
1. Present 3-5 problems that test breadth AND depth of current belt concepts
2. Problems should be challenging but fair for the current belt level
3. Evaluate strictly — belt promotions should be earned
4. Use all observation and mastery tools for each problem
5. After all problems, use \`complete_session\` with honest evaluation
6. If they pass, congratulate them. If not, give constructive feedback on what to work on.`;

    case 'kata':
      return `## Session Type: Kata (Maintenance)

Short practice session to maintain skills and prevent decay.

Instructions:
1. Present 1-2 focused problems targeting decayed or weak concepts
2. Keep it quick — this is maintenance, not deep learning
3. Use tools to update mastery and record observations
4. Finish with \`complete_session\``;

    case 'training':
    default:
      return `## Session Type: Training

Regular training session.

Instructions:
1. Review the suggested focus concepts above (if any)
2. Generate a fresh challenge that targets concepts needing reinforcement or new contexts
3. Present the problem using \`present_problem\` tool
4. The problem should feel like a real problem, not a textbook exercise
5. Don't hint at which concepts are being tested
6. After the student submits, evaluate their solution:
   a. Check for inline \`QUESTION:\` comments and answer them
   b. Evaluate correctness and code quality
   c. Use \`record_observation\` for each notable pattern
   d. Use \`update_mastery\` for each concept exercised
   e. Queue reinforcement for weak areas
7. Give focused feedback and complete the session`;
  }
}

function buildOutputFormat(sessionType) {
  return `## Output Format

- Communicate naturally with the student — you're a teacher, not a machine
- Use the provided tools to record structured data (observations, mastery, etc.)
- Keep explanations concise but clear
- Use code blocks with appropriate language tags when showing examples
- Format problems clearly with requirements and constraints
- After evaluating a submission, always use \`complete_session\` to finalize`;
}
