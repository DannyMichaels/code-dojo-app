import { describe, it, expect } from 'vitest';
import { computeMastery, checkBeltAdvancement, getNextBelt, BELT_ORDER } from '../services/masteryCalc.js';

describe('computeMastery', () => {
  it('returns 0 for null or no exposure', () => {
    expect(computeMastery(null)).toBe(0);
    expect(computeMastery({ exposureCount: 0 })).toBe(0);
  });

  it('computes basic ratio for recent concept', () => {
    const mastery = computeMastery({
      exposureCount: 10,
      successCount: 8,
      lastSeen: new Date(),
      streak: 0,
      contexts: [],
      observations: [],
    });

    // base ratio = 0.8, no streak bonus, no context bonus, no decay (recent)
    expect(mastery).toBeCloseTo(0.8, 1);
  });

  it('applies streak bonus', () => {
    const withStreak = computeMastery({
      exposureCount: 10,
      successCount: 8,
      lastSeen: new Date(),
      streak: 5,
      contexts: [],
      observations: [],
    });

    const withoutStreak = computeMastery({
      exposureCount: 10,
      successCount: 8,
      lastSeen: new Date(),
      streak: 0,
      contexts: [],
      observations: [],
    });

    expect(withStreak).toBeGreaterThan(withoutStreak);
  });

  it('applies context variety bonus', () => {
    const withContexts = computeMastery({
      exposureCount: 10,
      successCount: 8,
      lastSeen: new Date(),
      streak: 0,
      contexts: ['iteration', 'callbacks', 'error_handling'],
      observations: [],
    });

    const withoutContexts = computeMastery({
      exposureCount: 10,
      successCount: 8,
      lastSeen: new Date(),
      streak: 0,
      contexts: [],
      observations: [],
    });

    expect(withContexts).toBeGreaterThan(withoutContexts);
  });

  it('applies time decay', () => {
    const recent = computeMastery({
      exposureCount: 10,
      successCount: 8,
      lastSeen: new Date(),
      streak: 0,
      contexts: [],
      observations: [],
    });

    const old = computeMastery({
      exposureCount: 10,
      successCount: 8,
      lastSeen: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
      streak: 0,
      contexts: [],
      observations: [],
    });

    expect(recent).toBeGreaterThan(old);
  });

  it('fully decays after 90 days', () => {
    const mastery = computeMastery({
      exposureCount: 10,
      successCount: 10,
      lastSeen: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), // 100 days ago
      streak: 0,
      contexts: [],
      observations: [],
    });

    expect(mastery).toBe(0);
  });

  it('clamps between 0 and 1', () => {
    const high = computeMastery({
      exposureCount: 1,
      successCount: 1,
      lastSeen: new Date(),
      streak: 10,
      contexts: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
      observations: [],
    });

    expect(high).toBeLessThanOrEqual(1);
    expect(high).toBeGreaterThanOrEqual(0);
  });
});

describe('checkBeltAdvancement', () => {
  it('returns not eligible when at max belt', () => {
    const result = checkBeltAdvancement({ currentBelt: 'black', concepts: new Map() }, 100);
    expect(result.eligible).toBe(false);
    expect(result.nextBelt).toBeNull();
  });

  it('returns not eligible when not enough concepts', () => {
    const concepts = new Map([
      ['var1', { mastery: 0.9, exposureCount: 10, successCount: 9, lastSeen: new Date(), streak: 5, contexts: ['a', 'b'], beltLevel: 'white' }],
    ]);

    const result = checkBeltAdvancement({ currentBelt: 'white', concepts }, 5);
    expect(result.eligible).toBe(false);
    expect(result.details.totalConcepts).toBe(1);
    expect(result.details.requiredConcepts).toBe(2);
  });

  it('returns eligible when all thresholds met', () => {
    const concepts = new Map();
    // Create enough mastered concepts
    for (let i = 0; i < 3; i++) {
      concepts.set(`concept_${i}`, {
        mastery: 0.9,
        exposureCount: 10,
        successCount: 9,
        lastSeen: new Date(),
        streak: 5,
        contexts: ['a', 'b', 'c'],
        observations: [],
        beltLevel: 'white',
      });
    }

    const result = checkBeltAdvancement({ currentBelt: 'white', concepts }, 5);
    expect(result.eligible).toBe(true);
    expect(result.nextBelt).toBe('yellow');
  });

  it('returns not eligible when not enough sessions', () => {
    const concepts = new Map();
    for (let i = 0; i < 3; i++) {
      concepts.set(`concept_${i}`, {
        mastery: 0.9,
        exposureCount: 10,
        successCount: 9,
        lastSeen: new Date(),
        streak: 5,
        contexts: ['a', 'b', 'c'],
        observations: [],
        beltLevel: 'white',
      });
    }

    const result = checkBeltAdvancement({ currentBelt: 'white', concepts }, 0); // 0 sessions
    expect(result.eligible).toBe(false);
    expect(result.details.sessionCount).toBe(0);
  });
});

describe('getNextBelt', () => {
  it('returns next belt in order', () => {
    expect(getNextBelt('white')).toBe('yellow');
    expect(getNextBelt('yellow')).toBe('orange');
    expect(getNextBelt('brown')).toBe('black');
  });

  it('returns null for black belt', () => {
    expect(getNextBelt('black')).toBeNull();
  });

  it('returns null for invalid belt', () => {
    expect(getNextBelt('invalid')).toBeNull();
  });
});

describe('BELT_ORDER', () => {
  it('has correct number of belts', () => {
    expect(BELT_ORDER).toHaveLength(8);
  });

  it('starts with white and ends with black', () => {
    expect(BELT_ORDER[0]).toBe('white');
    expect(BELT_ORDER[BELT_ORDER.length - 1]).toBe('black');
  });
});
