import { GameRoom, ChatMessage } from '@/types/game';

// Global singleton to survive Next.js hot reloads in development
declare global {
  var __gameStore: GameStore | undefined;
}

// In-memory storage for game rooms and chat messages
class GameStore {
  private rooms: Map<string, GameRoom> = new Map();
  private chats: Map<string, ChatMessage[]> = new Map();
  private roomTimestamps: Map<string, number> = new Map();

  constructor() {
    console.log('GameStore constructor called - creating new instance');
    // Clean up old rooms every 5 minutes
    if (typeof window === 'undefined') {
      setInterval(() => {
        this.cleanupOldRooms();
      }, 5 * 60 * 1000);
    }
  }

  private cleanupOldRooms() {
    const now = Date.now();
    const maxAge = 2 * 60 * 60 * 1000; // 2 hours

    this.roomTimestamps.forEach((timestamp, roomId) => {
      if (now - timestamp > maxAge) {
        this.rooms.delete(roomId);
        this.chats.delete(roomId);
        this.roomTimestamps.delete(roomId);
      }
    });
  }

  private updateRoomTimestamp(roomId: string) {
    this.roomTimestamps.set(roomId, Date.now());
  }

  createRoom(id: string): GameRoom {
    console.log(`GameStore: Creating room ${id}`);
    const room: GameRoom = {
      id,
      players: [],
      currentRound: 1,
      maxRounds: 10,
      gamePhase: 'waiting',
      roundPhase: 'playing',
      currentPlayer: null,
      currentGuesser: null,
      rounds: [],
      started: false,
      hostId: undefined,
      timerDuration: 30000, // 30 seconds
      playersReady: [],
    };
    this.rooms.set(id, room);
    this.chats.set(id, []);
    this.updateRoomTimestamp(id);
    console.log(`GameStore: Room ${id} created. Total rooms: ${this.rooms.size}`);
    return room;
  }

  getRoom(id: string): GameRoom | undefined {
    console.log(`GameStore: Looking for room ${id}. Available rooms: [${this.getAllRooms().join(', ')}]`);
    const room = this.rooms.get(id);
    if (room) {
      this.updateRoomTimestamp(id);
      console.log(`GameStore: Found room ${id}`);
    } else {
      console.log(`GameStore: Room ${id} not found`);
    }
    return room;
  }

  updateRoom(id: string, room: GameRoom): void {
    this.rooms.set(id, room);
    this.updateRoomTimestamp(id);
  }

  addChatMessage(roomId: string, message: ChatMessage): void {
    const messages = this.chats.get(roomId) || [];
    messages.push(message);
    this.chats.set(roomId, messages);
    this.updateRoomTimestamp(roomId);
  }

  getChatMessages(roomId: string): ChatMessage[] {
    return this.chats.get(roomId) || [];
  }

  getAllRooms(): string[] {
    return Array.from(this.rooms.keys());
  }

  getRoomCount(): number {
    return this.rooms.size;
  }
}

// Use global singleton to survive Next.js hot reloads in development
if (typeof window === 'undefined') {
  if (!global.__gameStore) {
    global.__gameStore = new GameStore();
  }
}

export const gameStore = global.__gameStore || new GameStore();