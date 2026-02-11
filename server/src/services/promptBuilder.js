/**
 * 5-layer prompt builder for training sessions.
 *
 * Layer 1: Core Protocol (from trainingProtocol.js)
 * Layer 2: Skill Context (from SkillCatalog.trainingContext)
 * Layer 3: Current State (concepts, reinforcement queue, social stats)
 * Layer 4: Session Instructions (by type: onboarding, training, assessment, kata)
 * Layer 5: Output Format (tool usage instructions)
 */

import Session from '../models/Session.js';
import { TRAINING_PROTOCOL } from '../prompts/trainingProtocol.js';
import { applyTimeDecay, BELT_ORDER } from './masteryCalc.js';
import { getPrioritizedConcepts } from './spacedRepetition.js';
import { isTechCategory, isMusicCategory } from '../utils/skillCategories.js';

/**
 * Build the full system prompt for a training session.
 */
export async function buildSystemPrompt({ skillCatalog, userSkill, sessionType = 'training', socialStats = null, otherSkills = [] }) {
  // Static parts (don't change between messages within a session)
  const staticParts = [];
  staticParts.push(TRAINING_PROTOCOL);                              // Layer 1
  staticParts.push(buildSkillContext(skillCatalog));                 // Layer 2
  staticParts.push(buildSessionInstructions(sessionType, userSkill, skillCatalog)); // Layer 4
  staticParts.push(buildOutputFormat(sessionType));                  // Layer 5

  // Dynamic parts (change after tool calls — mastery scores, history, etc.)
  const dynamicParts = [];
  dynamicParts.push(buildCurrentState(userSkill, socialStats));     // Layer 3
  const otherSkillsCtx = buildOtherSkillsContext(otherSkills);      // Layer 3c
  if (otherSkillsCtx) dynamicParts.push(otherSkillsCtx);
  if (userSkill?._id) {                                             // Layer 3b
    const history = await buildProblemHistory(userSkill._id);
    if (history) dynamicParts.push(history);
  }

  return [
    staticParts.filter(Boolean).join('\n\n'),
    dynamicParts.filter(Boolean).join('\n\n'),
  ];
}

function buildSkillContext(skillCatalog) {
  if (!skillCatalog) return '';

  const lines = [];
  const category = skillCatalog.category || 'technology';

  if (skillCatalog.trainingContext) {
    lines.push(`## Skill: ${skillCatalog.name} (Category: ${category})\n\n${skillCatalog.trainingContext}`);
  } else {
    lines.push(`## Skill: ${skillCatalog.name} (Category: ${category})\n\nThis is a new skill being onboarded. No training context has been established yet. You will need to generate one during the onboarding session using the set_training_context tool.`);
  }

  if (isMusicCategory(category)) {
    lines.push(`\n**This is a MUSIC skill.** The student has an interactive music staff editor. When calling \`present_problem\`:
- Set \`language\` to \`"music-notation"\`
- Set \`starter_code\` to a JSON string with this format:
  {"clef":"treble","timeSignature":"4/4","keySignature":"C","notes":[{"keys":["c/4"],"duration":"q"}]}
- Clef options: "treble", "bass", "alto"
- Note format: keys array with pitch/octave (e.g. "c/4", "g#/3"), duration as VexFlow code ("w"=whole, "h"=half, "q"=quarter, "8"=eighth, "16"=sixteenth)
- You can provide an empty notes array for the student to fill in, or provide partial notation for them to complete
- The student will submit their notation as JSON. Evaluate the musical correctness of their answer.`);
  } else if (!isTechCategory(category)) {
    lines.push(`\n**This is NOT a programming skill.** Do NOT use the code editor. When calling \`present_problem\`, set \`starter_code\` to an empty string and \`language\` to an empty string. Present all challenges as text descriptions in your chat message. The student will respond via chat, not code.`);
  }

  return lines.join('\n');
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
      const mastery = applyTimeDecay(data);
      const daysSince = data.lastSeen
        ? Math.round((Date.now() - new Date(data.lastSeen).getTime()) / (1000 * 60 * 60 * 24))
        : null;
      const lastStr = daysSince !== null ? `${daysSince}d ago` : 'never';
      const obsCount = data.observations?.length || 0;
      const label = `${name} (${(mastery * 100).toFixed(0)}%, exp:${data.exposureCount || 0}, streak:${data.streak || 0}, last:${lastStr}${obsCount ? `, obs:${obsCount}` : ''})`;
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

function buildOtherSkillsContext(otherSkills) {
  if (!otherSkills || otherSkills.length === 0) return '';

  const lines = ['## Student\'s Other Skills'];
  for (const skill of otherSkills) {
    const name = skill.skillCatalogId?.name || 'Unknown';
    lines.push(`- ${name}: **${skill.currentBelt}** belt`);
  }
  lines.push('');
  lines.push('If the student ever claims a level that contradicts the data above (e.g. "I\'m a React expert" but their JS belt is yellow), you can be playful about the discrepancy — don\'t be mean, but a light tease is fine. If they mention a skill not tracked in the app, acknowledge it and note it as self-reported context.');
  return lines.join('\n');
}

function buildSessionInstructions(sessionType, userSkill, skillCatalog) {
  const isTech = isTechCategory(skillCatalog?.category);
  const isMusic = isMusicCategory(skillCatalog?.category);

  let editorInstruction;
  if (isMusic) {
    editorInstruction = `set \`language\` to \`"music-notation"\` and \`starter_code\` to a JSON notation string (see music instructions above) so the student's staff editor is pre-filled. ALSO write the full problem in your chat message — the tool does NOT display the problem text to the student`;
  } else if (isTech) {
    editorInstruction = `always include \`starter_code\` and \`language\` so the student's code editor is pre-filled. ALSO write the full problem in your chat message — the tool does NOT display the problem text to the student`;
  } else {
    editorInstruction = `set \`starter_code\` to an empty string and \`language\` to an empty string (this is not a code skill). Write the full problem in your chat message — the student will respond via chat`;
  }

  switch (sessionType) {
    case 'onboarding':
      return `## Session Type: Onboarding

This is the student's first session with this skill.

Instructions:
1. Read the student's first message carefully. If it already tells you what you need to know (their background, why they're learning, experience level), skip the welcome questions and go straight to tailored challenges. Otherwise, welcome them and have a brief, natural conversation — why are they learning this skill? What's their background? Starting from scratch, refreshing rusty knowledge, or already experienced? Don't ask them to rate themselves on a scale — just have a natural, short conversation.
2. Wait for their response before presenting any challenges (unless their first message already gave you enough context).
3. Present challenges ONE AT A TIME — present one, wait for the response, evaluate it, then decide what to present next. The number of challenges should be determined by the conversation flow and what you need to observe — don't commit to a fixed number upfront. Call \`present_problem\` to record metadata for each challenge — ${editorInstruction}
5. After each response, use \`record_observation\` and \`update_mastery\` tools to record data before presenting the next challenge
6. **CRITICAL — Ending the Onboarding**: When you've observed enough to determine their level, you MUST end the session in a SINGLE turn by calling ALL of these tools together:
   - \`set_belt\` — assign their belt level
   - \`set_training_context\` — save skill-specific training context (${isTech ? 'what makes code idiomatic, key concept areas, common anti-patterns, evaluation criteria' : 'key concept areas, common mistakes, evaluation criteria, what good practice looks like'})
   - \`complete_session\` — mark the onboarding as finished
   Then write your summary message announcing the belt and wrapping up. Do NOT write a summary, say "great work today", or announce a belt without calling these tools in the same response. If you write a wrap-up without calling the tools, the data is LOST and the session stays open.
7. Be encouraging but honest about where they're starting
8. **Follow the Scaffolding Policy**: When a student's ${isTech ? 'code' : 'response'} has issues, do NOT show them the corrected ${isTech ? 'solution' : 'answer'}. Tell them what's wrong conceptually and let them retry. Only reveal the answer if they explicitly give up. This is critical — even during onboarding, you are assessing their ability to self-correct, not just their first attempt.
9. **Tool Reminder**: Every belt assignment MUST use \`set_belt\`, every observation MUST use \`record_observation\`, and the session MUST end with \`complete_session\`. If you write a summary or say "great work today" without calling the corresponding tools, the data is LOST and the session remains open.`;

    case 'assessment':
      return `## Session Type: Belt Assessment

The student has requested a belt assessment. This is more rigorous than regular training.

Current belt: ${userSkill?.currentBelt || 'white'}
Testing readiness for: next belt

Instructions:
1. Present problems that test breadth AND depth of current belt concepts
2. Problems should be challenging but fair for the current belt level
3. Evaluate strictly — belt promotions should be earned
4. Use all observation and mastery tools for each problem
5. **Follow the Scaffolding Policy**: Never reveal solutions during an assessment. If the student fails a challenge, note the failure and move on to the next challenge. No hints during assessments — this is evaluation mode.
6. **Ending the Assessment**: After all problems, call \`complete_session\` with honest evaluation AND write a detailed assessment summary in the SAME response. The tool result will tell you whether they passed or failed (and if promoted, the new belt). Your final message must include:
   - **Result**: Did they pass or not? If promoted, announce the new belt clearly and celebrate it.
   - **Strengths**: What they demonstrated well during the assessment.
   - **Weaknesses**: Specific areas that need improvement (reference actual problems from the session).
   - **Next steps**: Concrete recommendations — what to practice next, what concepts to focus on, whether to continue training at the current level or prepare for the next assessment.
   - If they failed, be encouraging — explain exactly what gaps remain and how many more sessions they might need before retrying.
   Do NOT write an assessment summary without calling \`complete_session\` in the same turn — if you do, the session stays open and the data is LOST.`;

    case 'kata':
      return `## Session Type: Kata (Maintenance)

Short practice session to maintain skills and prevent decay.

Instructions:
1. Present focused problems targeting decayed or weak concepts
2. Keep it quick — this is maintenance, not deep learning
3. Use tools to update mastery and record observations
4. **Ending the Kata**: After the student completes the problem, call \`complete_session\` and write a brief wrap-up in the same response. Do NOT write a wrap-up without calling \`complete_session\` in the same turn.`;

    case 'training':
    default:
      return `## Session Type: Training

Regular training session.

Instructions:
1. **Start with a brief check-in** before presenting a problem. Keep it short (2-3 sentences max). Based on context:
   - If this is their first training session after onboarding: "Welcome back! Ready to start practicing? I have a challenge lined up, or if there's something specific you'd like to work on, let me know."
   - If they have previous sessions: Reference where they left off or what they were working on. Ask if they want to continue building on that, tackle weak spots, or try something new.
   - If concepts have decayed since last session: Mention it briefly — "It's been a while since we practiced X — want to do a quick refresher or jump into something new?"
   - Wait for the student's response before presenting a problem. Don't dump a challenge immediately.
2. Review the suggested focus concepts above (if any)
3. Generate a fresh challenge that targets concepts needing reinforcement or new contexts
4. Call \`present_problem\` tool to record the problem metadata — ${editorInstruction}
5. The problem should feel like a real ${isTech ? 'problem' : 'challenge'}, not a textbook exercise
6. Don't hint at which concepts are being tested
7. After the student submits, evaluate their ${isTech ? 'solution' : 'response'}:
   a. ${isTech ? 'Check for inline `QUESTION:` comments and answer them' : 'Review their reasoning and approach'}
   b. Evaluate correctness and ${isTech ? 'code quality' : 'quality of response'}
   c. Use \`record_observation\` for each notable pattern
   d. Use \`update_mastery\` for each concept exercised
   e. Queue reinforcement for weak areas
   f. **STOP after your evaluation feedback.** Do NOT present the next challenge in the same message. End your response after giving feedback. The student will reply when ready, and you present the next challenge then. This prevents long loading pauses caused by tool call round-trips mid-response.
8. **Follow the Scaffolding Policy**: If the ${isTech ? 'solution' : 'response'} has errors, do NOT show the corrected ${isTech ? 'code' : 'answer'}. Tell them what's wrong, give a hint, and let them try again. Progressively reveal more help on subsequent attempts. Only show the full ${isTech ? 'solution' : 'answer'} if the student explicitly gives up.${isTech ? ' For minor style issues on otherwise correct code, it\'s fine to show the cleaner version.' : ''}
9. **Session Length**: Present at least 3 challenges per session before considering completion. After 3+ problems, evaluate whether the student would benefit from more — if they're struggling, haven't demonstrated enough concepts, or you want to observe more patterns, continue. If they've shown solid understanding across targeted concepts, wrap up.
10. **Ending the Session**: When ready to wrap up (minimum 3 challenges presented), call ALL end-of-session tools (\`update_mastery\` for each concept, \`complete_session\`, optionally \`set_belt\`/\`set_assessment_available\`) in a SINGLE response, then write your wrap-up message in the same turn. Do NOT write "great work today" without calling \`complete_session\` — the session stays open.
11. **Belt Promotion**: If you observe sustained mastery that warrants a belt change, call \`set_belt\` directly. If close but want a formal assessment, call \`set_assessment_available\`.`;
  }
}

async function buildProblemHistory(skillId) {
  try {
    const recentSessions = await Session.find({
      skillId,
      'problem.prompt': { $ne: '' },
      status: { $in: ['completed', 'active'] },
    })
      .select('problem.prompt problem.conceptsTargeted evaluation.correctness date')
      .sort({ date: -1 })
      .limit(20)
      .lean();

    if (recentSessions.length === 0) return '';

    const lines = [
      '## Past Problems (DO NOT REPEAT)',
      'The following problems have already been given to this student. You MUST generate a novel, different problem each time. Never reuse the same scenario, theme, or problem shape unless the student explicitly asks to retry one.',
      '',
    ];

    for (const s of recentSessions) {
      const date = new Date(s.date).toISOString().split('T')[0];
      const concepts = s.problem.conceptsTargeted?.join(', ') || 'unspecified';
      const result = s.evaluation?.correctness || 'in-progress';
      // Truncate long prompts to save tokens
      const prompt = s.problem.prompt.length > 150
        ? s.problem.prompt.slice(0, 150) + '...'
        : s.problem.prompt;
      lines.push(`- [${date}] (${result}) [${concepts}]: ${prompt}`);
    }

    return lines.join('\n');
  } catch {
    return '';
  }
}

function buildOutputFormat(sessionType) {
  return `## Output Format

- Communicate naturally with the student — you're a teacher, not a machine
- Use the provided tools to record structured data (observations, mastery, etc.)
- Keep explanations concise but clear
- Use code blocks with appropriate language tags when showing examples
- Format problems clearly with requirements and constraints
- Call \`complete_session\` only after presenting at least 3 challenges (for training/assessment sessions)`;
}
