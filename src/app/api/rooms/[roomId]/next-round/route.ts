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
    
    console.log(`Next Round API: Player ${playerId} ready for next round in room ${roomId}`)
    
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

    if (room.roundPhase !== 'intermission') {
      return NextResponse.json(
        { success: false, error: 'Not in intermission phase' },
        { status: 400 }
      )
    }

    // Add player to ready list if not already there
    if (!room.playersReady.includes(playerId)) {
      room.playersReady.push(playerId)
    }

    // Check if both players are ready
    const allReady = room.players.every(p => room.playersReady.includes(p.id))
    
    if (allReady) {
      // Advance to next round or finish game
      if (room.currentRound < 10) { // 10 rounds total
        room.currentRound += 1
        
        // Determine current player and guesser based on round number
        // Odd rounds (1,3,5,7,9): Player 1's statements, Player 2 guesses
        // Even rounds (2,4,6,8,10): Player 2's statements, Player 1 guesses
        const playerIndex = (room.currentRound % 2 === 1) ? 0 : 1
        const guesserIndex = 1 - playerIndex
        
        room.currentPlayer = room.players[playerIndex].id
        room.currentGuesser = room.players[guesserIndex].id
        room.roundPhase = 'playing'
        room.timerStart = Date.now()
        room.playersReady = []
        
        await pusher.trigger(`room-${roomId}`, 'round-started', { room })
      } else {
        // Game finished
        room.gamePhase = 'finished'
        await pusher.trigger(`room-${roomId}`, 'game-finished', { room })
      }
    }

    gameStore.updateRoom(roomId, room)

    await pusher.trigger(`room-${roomId}`, 'room-update', room)

    return NextResponse.json({ 
      success: true,
      allReady,
      readyCount: room.playersReady.length
    })
  } catch (error) {
    console.error('Error advancing round:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to advance round' },
      { status: 500 }
    )
  }
}