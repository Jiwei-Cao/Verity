export interface Player {
  id: string;
  name: string;
  hasGenerated: boolean;
  ready: boolean;
  reviewComplete: boolean;
  rounds?: PlayerRound[];
}

export interface PlayerRound {
  truth: string;
  lie1: string;
  lie2: string;
  statements: string[];
  truthIndex: number;
  guess?: number;
  guessedCorrectly?: boolean;
  revealed?: boolean;
  timedOut?: boolean;
}

export interface GameRoom {
  id: string;
  players: Player[];
  currentRound: number; // Global round number (1-10)
  maxRounds: number; // Total rounds = 10
  gamePhase: 'waiting' | 'generating' | 'ready' | 'playing' | 'finished';
  roundPhase: 'playing' | 'intermission';
  currentPlayer: string | null; // Player whose statements are being shown
  currentGuesser: string | null; // Player who is guessing
  rounds: GameRound[];
  started: boolean;
  hostId?: string;
  timerStart?: number;
  timerDuration: number;
  playersReady: string[];
}

export interface GameRound {
  playerName: string;
  playerId: string;
  statements: string[];
  truthIndex: number;
  guesses: { [playerId: string]: number };
  revealed: boolean;
  guess?: number;
  guessedCorrectly?: boolean;
  timedOut?: boolean;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
  isSystem: boolean;
}