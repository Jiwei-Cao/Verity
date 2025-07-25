import { NextRequest, NextResponse } from 'next/server'
import { gameStore } from '@/lib/game-store'
import { pusher } from '@/lib/pusher'

export async function POST(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const { playerId, guess } = await request.json()
    const roomId = params.roomId
    
    console.log(`Guess API: Player ${playerId} guessed ${guess} in room ${roomId}`)
    
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

    // Get current round from the player being guessed about
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

    const isCorrect = guess === currentRound.truthIndex
    
    // Update round with guess
    currentRound.guess = guess
    currentRound.guessedCorrectly = isCorrect
    currentRound.revealed = true

    // Move to intermission phase
    room.roundPhase = 'intermission'
    room.playersReady = []

    gameStore.updateRoom(roomId, room)

    // Broadcast round result
    await pusher.trigger(`room-${roomId}`, 'round-result', {
      room,
      guess,
      isCorrect,
      correctAnswer: currentRound.truthIndex,
      correctStatement: currentRound.statements[currentRound.truthIndex]
    })

    return NextResponse.json({ 
      success: true,
      isCorrect,
      correctAnswer: currentRound.truthIndex
    })
  } catch (error) {
    console.error('Error processing guess:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process guess' },
      { status: 500 }
    )
  }
}