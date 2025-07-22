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
    
    const room = gameStore.getRoom(roomId)
    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Room not found' },
        { status: 404 }
      )
    }

    const currentRound = room.rounds[room.currentRound]
    if (!currentRound || currentRound.revealed) {
      return NextResponse.json(
        { success: false, error: 'No active round' },
        { status: 400 }
      )
    }

    // Record the guess
    currentRound.guesses[playerId] = guess

    // Check if all players have guessed
    const allGuessed = room.players.every(p => 
      currentRound.guesses.hasOwnProperty(p.id)
    )

    if (allGuessed) {
      // Reveal the answer
      currentRound.revealed = true
      
      // Move to next round or finish game
      if (room.currentRound < room.maxRounds - 1) {
        // More rounds to play
        setTimeout(async () => {
          room.currentRound++
          if (room.currentRound < room.rounds.length) {
            // Next player's round
            room.gamePhase = 'guessing'
          } else {
            // Need more generation
            room.gamePhase = 'generating'
            room.players.forEach(p => p.hasGenerated = false)
          }
          
          gameStore.updateRoom(roomId, room)
          await pusher.trigger(`room-${roomId}`, 'room-update', room)
        }, 3000) // 3 second delay before next round
      } else {
        // Game finished
        room.gamePhase = 'finished'
      }
    }

    gameStore.updateRoom(roomId, room)

    // Broadcast room update
    await pusher.trigger(`room-${roomId}`, 'room-update', room)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error making guess:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to make guess' },
      { status: 500 }
    )
  }
}