import { NextRequest, NextResponse } from 'next/server'
import { gameStore } from '@/lib/game-store'
import { pusher } from '@/lib/pusher'
import { GameRound } from '@/types/game'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const { playerId, playerName } = await request.json()
    const roomId = params.roomId
    
    const room = gameStore.getRoom(roomId)
    if (!room) {
      console.log(`Generate: Room ${roomId} not found. Available rooms:`, gameStore.getAllRooms())
      return NextResponse.json(
        { success: false, error: 'Room not found' },
        { status: 404 }
      )
    }

    // Find player and check if they can generate
    const player = room.players.find(p => p.id === playerId)
    if (!player) {
      return NextResponse.json(
        { success: false, error: 'Player not found' },
        { status: 404 }
      )
    }

    if (player.hasGenerated) {
      return NextResponse.json(
        { success: false, error: 'Player has already generated statements' },
        { status: 400 }
      )
    }

    // Generate statements using Claude API
    const prompt = `Generate exactly 3 statements about a person named "${playerName}". 
    - 2 statements should be lies (false/made-up)
    - 1 statement should be plausible as truth
    - Make them interesting and personal
    - Each statement should be 1-2 sentences
    - Return only the 3 statements, numbered 1-3, nothing else
    - Make the statements sound believable and engaging for a game`

    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    
    // Parse the response to extract statements
    const lines = responseText.split('\n').filter(line => line.trim())
    const statements = lines
      .filter(line => /^\d+\./.test(line.trim()))
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .slice(0, 3)

    if (statements.length !== 3) {
      throw new Error('Failed to generate exactly 3 statements')
    }

    // Randomly select which one is the "truth" (for game purposes)
    const truthIndex = Math.floor(Math.random() * 3)

    // Create game round
    const gameRound: GameRound = {
      playerName,
      statements,
      truthIndex,
      guesses: {},
      revealed: false
    }

    // Update room state
    room.rounds.push(gameRound)
    player.hasGenerated = true

    // Check if all players have generated
    const allGenerated = room.players.every(p => p.hasGenerated)
    if (allGenerated) {
      room.gamePhase = 'guessing'
      room.currentPlayer = room.players[0].id
    }

    gameStore.updateRoom(roomId, room)

    // Broadcast room update
    await pusher.trigger(`room-${roomId}`, 'room-update', room)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error generating statements:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate statements' },
      { status: 500 }
    )
  }
}