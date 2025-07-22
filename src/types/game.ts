export interface Player {
  id: string;
  name: string;
  hasGenerated: boolean;
}

export interface GameRoom {
  id: string;
  players: Player[];
  currentRound: number;
  maxRounds: number;
  gamePhase: 'waiting' | 'generating' | 'guessing' | 'finished';
  currentPlayer: string | null;
  rounds: GameRound[];
}

export interface GameRound {
  playerName: string;
  statements: string[];
  truthIndex: number;
  guesses: { [playerId: string]: number };
  revealed: boolean;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
  isSystem: boolean;
}