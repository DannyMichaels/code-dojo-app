import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from '../services/promptBuilder.js';

describe('promptBuilder', () => {
  it('builds all 5 layers for a training session', async () => {
    const result = await buildSystemPrompt({
      skillCatalog: {
        name: 'JavaScript',
        trainingContext: 'Focus on closures, prototypes, and async patterns.',
      },
      userSkill: {
        currentBelt: 'yellow',
        assessmentAvailable: false,
        concepts: new Map([
          ['closures', { mastery: 0.7, exposureCount: 5, successCount: 4, lastSeen: new Date(), streak: 2, contexts: ['callbacks', 'modules'], beltLevel: 'yellow' }],
          ['prototypes', { mastery: 0.3, exposureCount: 3, successCount: 1, lastSeen: new Date(), streak: 0, contexts: ['inheritance'], beltLevel: 'yellow' }],
        ]),
        reinforcementQueue: [
          { concept: 'prototypes', priority: 'high', context: 'delegation' },
        ],
      },
      sessionType: 'training',
    });

    // Returns [static, dynamic] array
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);

    const [staticBlock, dynamicBlock] = result;
    const prompt = result.join('\n\n');

    // Layer 1: Core Protocol (static)
    expect(staticBlock).toContain('training sensei');
    expect(staticBlock).toContain('Core Philosophy');

    // Layer 2: Skill Context (static)
    expect(staticBlock).toContain('Skill: JavaScript');
    expect(staticBlock).toContain('Focus on closures');

    // Layer 3: Current State — enriched concept labels (dynamic)
    expect(dynamicBlock).toContain('Current Belt: **yellow**');
    expect(dynamicBlock).toContain('Tracked Concepts: 2');
    expect(dynamicBlock).toContain('exp:5');
    expect(dynamicBlock).toContain('streak:2');
    expect(dynamicBlock).toContain('last:0d ago');
    expect(dynamicBlock).toContain('Reinforcement Queue: prototypes (high)');

    // Layer 4: Session Instructions (static)
    expect(staticBlock).toContain('Session Type: Training');
    expect(staticBlock).toContain('present_problem');

    // Layer 5: Output Format (static)
    expect(staticBlock).toContain('Output Format');
    expect(prompt).toContain('complete_session');
  });

  it('builds onboarding prompt for new skill', async () => {
    const result = await buildSystemPrompt({
      skillCatalog: { name: 'Rust' },
      userSkill: {
        currentBelt: 'white',
        assessmentAvailable: false,
        concepts: new Map(),
        reinforcementQueue: [],
      },
      sessionType: 'onboarding',
    });

    const prompt = result.join('\n\n');
    expect(prompt).toContain('Skill: Rust');
    expect(prompt).toContain('new skill being onboarded');
    expect(prompt).toContain('Session Type: Onboarding');
    expect(prompt).toContain('set_training_context');
    expect(prompt).toContain('Present challenges ONE AT A TIME');
  });

  it('builds assessment prompt', async () => {
    const result = await buildSystemPrompt({
      skillCatalog: { name: 'Python', trainingContext: 'Pythonic code patterns.' },
      userSkill: {
        currentBelt: 'green',
        assessmentAvailable: true,
        concepts: new Map(),
        reinforcementQueue: [],
      },
      sessionType: 'assessment',
    });

    const prompt = result.join('\n\n');
    expect(prompt).toContain('Session Type: Belt Assessment');
    expect(prompt).toContain('Current belt: green');
    expect(prompt).toContain('Evaluate strictly');
  });

  it('builds kata prompt', async () => {
    const result = await buildSystemPrompt({
      skillCatalog: { name: 'Ruby', trainingContext: 'Ruby idioms.' },
      userSkill: {
        currentBelt: 'blue',
        assessmentAvailable: false,
        concepts: new Map(),
        reinforcementQueue: [],
      },
      sessionType: 'kata',
    });

    const prompt = result.join('\n\n');
    expect(prompt).toContain('Session Type: Kata');
    expect(prompt).toContain('maintenance');
  });

  it('includes social stats when provided', async () => {
    const result = await buildSystemPrompt({
      skillCatalog: { name: 'Go', trainingContext: 'Go idioms.' },
      userSkill: {
        currentBelt: 'white',
        assessmentAvailable: false,
        concepts: new Map(),
        reinforcementQueue: [],
      },
      sessionType: 'training',
      socialStats: {
        totalStudents: 42,
        avgTimeToNextBelt: '2 weeks',
        recentPromotions: 5,
      },
    });

    // Social stats are dynamic (part of current state)
    const [, dynamicBlock] = result;
    expect(dynamicBlock).toContain('Community Context');
    expect(dynamicBlock).toContain('42 students');
    expect(dynamicBlock).toContain('2 weeks');
    expect(dynamicBlock).toContain('5 students promoted');
  });

  it('handles null skillCatalog and userSkill gracefully', async () => {
    const result = await buildSystemPrompt({
      skillCatalog: null,
      userSkill: null,
      sessionType: 'training',
    });

    expect(Array.isArray(result)).toBe(true);
    const prompt = result.join('\n\n');
    expect(prompt).toContain('training sensei');
    expect(prompt).toContain('Session Type: Training');
  });
});
