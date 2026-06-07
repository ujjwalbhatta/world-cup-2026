export type GroupId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L';

export interface GroupPick {
  first: string;
  second: string;
  third: string;
}

export interface Prediction {
  player: string;
  groups: Record<GroupId, GroupPick>;
  bestThirds: string[];         // exactly 8 team names
  winners: Record<number, string>; // match id (73..104) -> team name
}

export type Results = Partial<Pick<Prediction, 'groups' | 'bestThirds' | 'winners'>>;

// Project 2 types
export type Outcome = 'home' | 'draw' | 'away';

export interface MatchPick {
  player: string;
  matchId: number;
  pick: Outcome;
}

export interface MatchResult {
  matchId: number;
  home?: string;
  away?: string;
  result?: Outcome;
}
