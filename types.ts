
export enum RefinementGoal {
  GENERAL = 'General Improvement',
  TECHNICAL = 'Technical & Scientific',
  CREATIVE = 'Creative & Descriptive',
  CONCISE = 'Ultra Concise',
  CODING = 'Software Development',
  STRUCTURED = 'Highly Structured/JSON'
}

export interface RefinementHistory {
  id: string;
  original: string;
  refined: string;
  goal: RefinementGoal;
  timestamp: number;
}
