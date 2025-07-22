import { NextRequest, NextResponse } from 'next/server'
import { gameStore } from '@/lib/game-store'
import { pusher } from '@/lib/pusher'

export async function POST(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const { playerId } = await request.json()
    const roomId = params.roomId
    
    console.log(`Start API: Request from player ${playerId} for room ${roomId}`)
    
    const room = gameStore.getRoom(roomId)
    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Room not found' },
        { status: 404 }
      )
    }

    const player = room.players.find(p => p.id === playerId)
    if (!player) {
      return NextResponse.json(
        { success: false, error: 'Player not found' },
        { status: 404 }
      )
    }

    // Check if player is host (first player)
    if (room.hostId !== playerId) {
      return NextResponse.json(
        { success: false, error: 'Only the host can start the game' },
        { status: 403 }
      )
    }

    // Check if both players are ready
    const allReady = room.players.every(p => p.ready)
    if (!allReady) {
      return NextResponse.json(
        { success: false, error: 'All players must be ready before starting' },
        { status: 400 }
      )
    }

    if (room.players.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Need 2 players to start the game' },
        { status: 400 }
      )
    }

    // Start the game
    room.started = true
    room.gamePhase = 'playing'
    room.roundPhase = 'playing'
    room.currentRound = 1 // Start with round 1
    room.currentPlayer = room.players[0].id // Player whose statements are being shown (Player 1 for odd rounds)
    room.currentGuesser = room.players[1].id // Player who is guessing (Player 2 for odd rounds)
    room.timerStart = Date.now()
    room.playersReady = []

    gameStore.updateRoom(roomId, room)

    // Broadcast game start to all players
    await pusher.trigger(`room-${roomId}`, 'game-started', {
      room,
      message: 'The game has started!'
    })

    return NextResponse.json({ 
      success: true,
      message: 'Game started successfully'
    })
  } catch (error) {
    console.error('Error starting game:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to start game' },
      { status: 500 }
    )
  }
}