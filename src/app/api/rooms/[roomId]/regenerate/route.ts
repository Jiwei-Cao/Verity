import { NextRequest, NextResponse } from 'next/server'
import { gameStore } from '@/lib/game-store'
import { pusher } from '@/lib/pusher'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const { playerName, truth, roundIndex } = await request.json()
    const roomId = params.roomId
    
    console.log(`Regenerate API: Player ${playerName} regenerating round ${roundIndex} for truth: "${truth}"`)
    
    if (typeof roundIndex !== 'number' || roundIndex < 0 || roundIndex > 4) {
      return NextResponse.json(
        { success: false, error: 'Invalid round index. Must be 0-4.' },
        { status: 400 }
      )
    }
    
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

    if (!player.rounds || !player.rounds[roundIndex]) {
      return NextResponse.json(
        { success: false, error: 'Round not found' },
        { status: 404 }
      )
    }

    const currentRound = player.rounds[roundIndex]
    if (currentRound.truth !== truth) {
      return NextResponse.json(
        { success: false, error: 'Truth mismatch' },
        { status: 400 }
      )
    }

    // Generate new lies using Claude API
    const prompt = `Generate 2 believable but false statements to accompany the following truth: '${truth}'. Output only the 2 false statements as a plain numbered list.`

    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''
    
    const lines = responseText.split('\n').filter(line => line.trim())
    const lies = lines
      .filter(line => /^\d+\./.test(line.trim()))
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .slice(0, 2)

    if (lies.length !== 2) {
      throw new Error(`Failed to generate exactly 2 lies for truth: "${truth}"`)
    }

    // Create new shuffled statements
    const statements = [...lies, truth]
    const truthIndex = Math.floor(Math.random() * 3)
    
    const shuffledStatements = [...statements]
    shuffledStatements[truthIndex] = truth
    shuffledStatements[truthIndex === 0 ? 1 : 0] = lies[0]
    shuffledStatements[truthIndex === 2 ? 1 : 2] = lies[1]

    // Update the specific round
    player.rounds[roundIndex] = {
      truth,
      lie1: lies[0],
      lie2: lies[1],
      statements: shuffledStatements,
      truthIndex
    }

    gameStore.updateRoom(roomId, room)

    // Broadcast room update
    await pusher.trigger(`room-${roomId}`, 'room-update', room)

    return NextResponse.json({ 
      success: true,
      round: player.rounds[roundIndex]
    })
  } catch (error) {
    console.error('Error regenerating lies:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to regenerate lies' },
      { status: 500 }
    )
  }
}