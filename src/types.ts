export type RaceStatus = "idle" | "countdown" | "racing" | "finished";

export type AvatarType = "car" | "rocket" | "horse";

export interface AvatarOption {
  type: AvatarType;
  emoji: string;
  name: string;
  color: string;
  bgColor: string;
  trailColor: string;
}

export interface TyperacerQuote {
  id: string;
  text: string;
  source: string;
  difficulty: "Easy" | "Medium" | "Hard";
  language: "mn" | "en";
}

export interface Competitor {
  id: string;
  name: string;
  avatar: AvatarType;
  emoji: string;
  color: string;
  speedWPM: number; // Target WPM speed for this competitor
  progress: number; // 0 to 100
  isFinished: boolean;
  finishTime?: number; // timestamp or elapsed seconds
}

export interface GameStats {
  wpm: number;
  accuracy: number;
  errorCount: number;
  timeElapsed: number; // in seconds
}

export interface ScoreRecord {
  id: string;
  date: string;
  wpm: number;
  accuracy: number;
  errorCount: number;
  avatar: AvatarType;
  textTitle: string;
  language: "mn" | "en";
}
