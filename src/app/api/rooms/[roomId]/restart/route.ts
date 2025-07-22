import { NextRequest, NextResponse } from 'next/server'
import { gameStore } from '@/lib/game-store'
import Pusher from 'pusher'

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
})

export async function POST(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const { roomId } = params
    const room = gameStore.getRoom(roomId)
    
    if (!room) {
      return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 })
    }

    // Reset the room to initial state
    const resetRoom = {
      ...room,
      currentRound: 1,
      gamePhase: 'generating' as const,
      roundPhase: 'playing' as const,
      currentPlayer: null,
      currentGuesser: null,
      rounds: [],
      started: false,
      playersReady: [],
      players: room.players.map(player => ({
        ...player,
        hasGenerated: false,
        ready: false,
        reviewComplete: false,
        rounds: undefined
      }))
    }

    gameStore.updateRoom(roomId, resetRoom)

    // Broadcast the room reset to all clients
    await pusher.trigger(`room-${roomId}`, 'room-restart', {
      room: resetRoom,
      message: 'Game has been restarted. Enter new truths to begin!'
    })

    return NextResponse.json({ 
      success: true, 
      room: resetRoom 
    })
  } catch (error) {
    console.error('Error restarting game:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to restart game' },
      { status: 500 }
    )
  }
}