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
    
    console.log(`Timeout API: Round timeout for player ${playerId} in room ${roomId}`)
    
    const room = gameStore.getRoom(roomId)
    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Room not found' },
        { status: 404 }
      )
    }

    if (room.currentGuesser !== playerId) {
      return NextResponse.json(
        { success: false, error: 'Not your turn to guess' },
        { status: 400 }
      )
    }

    if (room.roundPhase !== 'playing') {
      return NextResponse.json(
        { success: false, error: 'Round is not in playing phase' },
        { status: 400 }
      )
    }

    // Get current round
    const currentPlayerObj = room.players.find(p => p.id === room.currentPlayer)
    // Calculate which set index to use (0-4) for the current player
    const playerRoundIndex = Math.floor((room.currentRound - 1) / 2)
    const currentRound = currentPlayerObj?.rounds?.[playerRoundIndex]
    
    if (!currentRound) {
      return NextResponse.json(
        { success: false, error: 'No current round found' },
        { status: 400 }
      )
    }

    // Mark as timed out
    currentRound.timedOut = true
    currentRound.guessedCorrectly = false
    currentRound.revealed = true

    // Move to intermission phase
    room.roundPhase = 'intermission'
    room.playersReady = []

    gameStore.updateRoom(roomId, room)

    // Broadcast timeout result
    await pusher.trigger(`room-${roomId}`, 'round-result', {
      room,
      timedOut: true,
      isCorrect: false,
      correctAnswer: currentRound.truthIndex,
      correctStatement: currentRound.statements[currentRound.truthIndex]
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error processing timeout:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process timeout' },
      { status: 500 }
    )
  }
}