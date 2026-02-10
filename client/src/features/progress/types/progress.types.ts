export interface DashboardProgress {
  totalSkills: number;
  totalSessions: number;
  completedSessions: number;
  skills: SkillSummary[];
}

export interface SkillSummary {
  _id: string;
  name: string;
  slug: string;
  currentBelt: string;
  conceptCount: number;
  avgMastery: number;
  assessmentAvailable: boolean;
}

export interface SkillProgress {
  skill: { name: string; slug: string; currentBelt: string; assessmentAvailable: boolean };
  sessionCount: number;
  recentSessions: any[];
  beltHistory: any[];
  concepts: ConceptDetail[];
  reinforcementQueue: any[];
}

export interface ConceptDetail {
  name: string;
  mastery: number;
  exposureCount: number;
  streak: number;
  contexts: string[];
  beltLevel: string;
  lastSeen: string | null;
}

export interface BeltInfo {
  currentBelt: string;
  nextBelt: string | null;
  eligible: boolean;
  beltOrder: string[];
  currentBeltIndex: number;
  details: {
    conceptPct: number;
    requiredPct: number;
    sessionCount: number;
    requiredSessions: number;
    totalConcepts: number;
    requiredConcepts: number;
    masteredConcepts: number;
    reason?: string;
  };
}
