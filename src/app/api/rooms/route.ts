import { NextResponse } from 'next/server'
import { gameStore } from '@/lib/game-store'

// Create a new game room
export async function POST() {
  try {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase()
    const room = gameStore.createRoom(roomId)
    
    return NextResponse.json({ 
      success: true, 
      roomId: room.id 
    })
  } catch (error) {
    console.error('Error creating room:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create room' },
      { status: 500 }
    )
  }
}