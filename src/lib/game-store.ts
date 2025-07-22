import { GameRoom, ChatMessage } from '@/types/game';

// In-memory storage for game rooms and chat messages
class GameStore {
  private rooms: Map<string, GameRoom> = new Map();
  private chats: Map<string, ChatMessage[]> = new Map();
  private roomTimestamps: Map<string, number> = new Map();

  constructor() {
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
    const room: GameRoom = {
      id,
      players: [],
      currentRound: 0,
      maxRounds: 5,
      gamePhase: 'waiting',
      currentPlayer: null,
      rounds: [],
    };
    this.rooms.set(id, room);
    this.chats.set(id, []);
    this.updateRoomTimestamp(id);
    return room;
  }

  getRoom(id: string): GameRoom | undefined {
    const room = this.rooms.get(id);
    if (room) {
      this.updateRoomTimestamp(id);
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

export const gameStore = new GameStore();