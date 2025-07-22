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
    const { playerId } = await request.json()
    
    const room = gameStore.getRoom(roomId)
    
    if (!room) {
      return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 })
    }

    const playerToRemove = room.players.find(p => p.id === playerId)
    if (!playerToRemove) {
      return NextResponse.json({ success: false, error: 'Player not found in room' }, { status: 404 })
    }

    // Remove player from room
    const updatedRoom = {
      ...room,
      players: room.players.filter(p => p.id !== playerId),
      playersReady: room.playersReady.filter(id => id !== playerId)
    }

    // If host is leaving, assign new host to first remaining player
    if (room.hostId === playerId && updatedRoom.players.length > 0) {
      updatedRoom.hostId = updatedRoom.players[0].id
    }

    // If no players remain, we could delete the room, but we'll leave it for potential rejoining
    if (updatedRoom.players.length === 0) {
      // Optionally delete the room entirely
      // For now, we'll keep the room but reset it
      updatedRoom.gamePhase = 'waiting'
      updatedRoom.started = false
      updatedRoom.hostId = undefined
    }

    gameStore.updateRoom(roomId, updatedRoom)

    // Broadcast player leave event to remaining players
    if (updatedRoom.players.length > 0) {
      await pusher.trigger(`room-${roomId}`, 'player-left', {
        room: updatedRoom,
        playerName: playerToRemove.name,
        message: `${playerToRemove.name} has left the room`
      })
    }

    return NextResponse.json({ 
      success: true,
      room: updatedRoom
    })
  } catch (error) {
    console.error('Error leaving room:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to leave room' },
      { status: 500 }
    )
  }
}