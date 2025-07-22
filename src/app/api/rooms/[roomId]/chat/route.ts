import { NextRequest, NextResponse } from 'next/server'
import { gameStore } from '@/lib/game-store'
import { pusher } from '@/lib/pusher'
import { ChatMessage } from '@/types/game'

export async function POST(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const { playerId, playerName, message } = await request.json()
    const roomId = params.roomId
    
    const room = gameStore.getRoom(roomId)
    if (!room) {
      console.log(`Chat: Room ${roomId} not found. Available rooms:`, gameStore.getAllRooms())
      return NextResponse.json(
        { success: false, error: 'Room not found' },
        { status: 404 }
      )
    }

    const chatMessage: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      playerId,
      playerName,
      message,
      timestamp: Date.now(),
      isSystem: false
    }

    gameStore.addChatMessage(roomId, chatMessage)

    // Broadcast message
    await pusher.trigger(`room-${roomId}`, 'chat-message', chatMessage)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending chat message:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    )
  }
}