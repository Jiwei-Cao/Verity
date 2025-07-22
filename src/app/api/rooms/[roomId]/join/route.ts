import { NextRequest, NextResponse } from 'next/server'
import { gameStore } from '@/lib/game-store'
import { pusher } from '@/lib/pusher'
import { Player, ChatMessage } from '@/types/game'

export async function POST(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const { playerName } = await request.json()
    const roomId = params.roomId
    
    let room = gameStore.getRoom(roomId)
    if (!room) {
      // Create room if it doesn't exist
      room = gameStore.createRoom(roomId)
    }

    // Check if player already exists
    const existingPlayer = room.players.find(p => p.name === playerName)
    if (existingPlayer) {
      return NextResponse.json({
        success: true,
        player: existingPlayer,
        room,
        chatMessages: gameStore.getChatMessages(roomId)
      })
    }

    // Check room capacity
    if (room.players.length >= 2) {
      return NextResponse.json(
        { success: false, error: 'Room is full' },
        { status: 400 }
      )
    }

    // Create new player
    const player: Player = {
      id: Math.random().toString(36).substring(2, 9),
      name: playerName,
      hasGenerated: false,
      ready: false,
      reviewComplete: false
    }

    // Set first player as host
    if (room.players.length === 0) {
      room.hostId = player.id
    }

    // Add player to room
    room.players.push(player)
    
    // Start generation phase if room is full
    if (room.players.length === 2) {
      room.gamePhase = 'generating'
    }

    gameStore.updateRoom(roomId, room)

    // Send welcome message
    const welcomeMessage: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      playerId: player.id,
      playerName: player.name,
      message: `Hello I am ${player.name}`,
      timestamp: Date.now(),
      isSystem: true
    }

    gameStore.addChatMessage(roomId, welcomeMessage)

    // Broadcast updates
    await Promise.all([
      pusher.trigger(`room-${roomId}`, 'room-update', room),
      pusher.trigger(`room-${roomId}`, 'chat-message', welcomeMessage),
      pusher.trigger(`room-${roomId}`, 'player-joined', { player, room })
    ])

    return NextResponse.json({
      success: true,
      player,
      room,
      chatMessages: gameStore.getChatMessages(roomId)
    })
  } catch (error) {
    console.error('Error joining room:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to join room' },
      { status: 500 }
    )
  }
}