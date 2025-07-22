import { NextRequest, NextResponse } from 'next/server'
import { gameStore } from '@/lib/game-store'
import { pusher } from '@/lib/pusher'

export async function POST(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const { playerName, reviewComplete } = await request.json()
    const roomId = params.roomId
    
    console.log(`Review Complete API: Player ${playerName} setting review complete to ${reviewComplete}`)
    
    const room = gameStore.getRoom(roomId)
    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Room not found' },
        { status: 404 }
      )
    }

    const player = room.players.find(p => p.name === playerName)
    if (!player) {
      return NextResponse.json(
        { success: false, error: 'Player not found' },
        { status: 404 }
      )
    }

    player.reviewComplete = reviewComplete

    gameStore.updateRoom(roomId, room)

    // Broadcast room update
    await pusher.trigger(`room-${roomId}`, 'room-update', room)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating review status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update review status' },
      { status: 500 }
    )
  }
}