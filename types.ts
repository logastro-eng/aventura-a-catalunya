
export interface Question {
  id: string;
  question: string;
  options: string[];
  answer: string;
}

export interface LevelConfig {
  id: number;
  name: string;
  topic: string;
  difficulty: string;
  color: string;
  bgEmoji: string;
}

export type CharacterType = 'GEMMA' | 'OSCAR';

export type GameState = 'START' | 'CHARACTER_SELECT' | 'MAP' | 'PLAYING' | 'WIN' | 'GAMEOVER';

export interface PowerUps {
  barretina: number;
  basto: number;
}

export interface UserProgress {
  currentLevel: number;
  unlockedLevels: number[];
  totalScore: number;
  character: CharacterType | null;
  powerUps: PowerUps;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
}
