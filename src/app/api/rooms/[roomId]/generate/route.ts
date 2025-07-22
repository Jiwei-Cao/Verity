import { NextRequest, NextResponse } from 'next/server'
import { gameStore } from '@/lib/game-store'
import { pusher } from '@/lib/pusher'
import { PlayerRound } from '@/types/game'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const { playerName, truths } = await request.json()
    const roomId = params.roomId
    
    console.log(`Generate API: Received request for roomId: ${roomId}`)
    console.log(`Generate API: Params:`, params)
    console.log(`Generate API: PlayerName: ${playerName}`)
    console.log(`Generate API: Truths count: ${truths?.length || 0}`)
    
    if (!truths || !Array.isArray(truths) || truths.length !== 5) {
      return NextResponse.json(
        { success: false, error: 'Must provide exactly 5 truths' },
        { status: 400 }
      )
    }
    
    let room = gameStore.getRoom(roomId)
    if (!room) {
      console.log(`Generate API: Room ${roomId} not found, attempting to create it`)
      // Try to create the room if it doesn't exist (fallback for development hot reloads)
      room = gameStore.createRoom(roomId)
      console.log(`Generate API: Created new room ${roomId}`)
    }
    
    if (!room) {
      console.log(`Generate: Failed to create room ${roomId}`)
      return NextResponse.json(
        { success: false, error: `Unable to find or create room ${roomId}` },
        { status: 404 }
      )
    }

    console.log(`Generate API: Looking for player ${playerName} in room ${roomId}`)
    console.log(`Generate API: Room players:`, room.players.map(p => p.name))
    
    let player = room.players.find(p => p.name === playerName)
    if (!player) {
      console.log(`Generate API: Player ${playerName} not found, creating new player`)
      // Create player if not found (fallback for development hot reloads)
      player = {
        id: Math.random().toString(36).substring(2, 9),
        name: playerName,
        hasGenerated: false,
        ready: false,
        reviewComplete: false
      }
      room.players.push(player)
      gameStore.updateRoom(roomId, room)
      console.log(`Generate API: Created new player ${playerName}`)
    }

    if (player.hasGenerated) {
      return NextResponse.json(
        { success: false, error: 'Player has already generated statements' },
        { status: 400 }
      )
    }

    const playerRounds: PlayerRound[] = []

    for (let i = 0; i < truths.length; i++) {
      const truth = truths[i]
      
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

      const statements = [...lies, truth]
      const truthIndex = Math.floor(Math.random() * 3)
      
      const shuffledStatements = [...statements]
      shuffledStatements[truthIndex] = truth
      shuffledStatements[truthIndex === 0 ? 1 : 0] = lies[0]
      shuffledStatements[truthIndex === 2 ? 1 : 2] = lies[1]

      playerRounds.push({
        truth,
        lie1: lies[0],
        lie2: lies[1],
        statements: shuffledStatements,
        truthIndex
      })
    }

    player.rounds = playerRounds
    player.hasGenerated = true
    player.ready = true
    player.reviewComplete = true // Auto-mark as reviewed since it's read-only

    const allGenerated = room.players.every(p => p.hasGenerated)
    if (allGenerated && room.players.length === 2) {
      room.gamePhase = 'ready'
    }

    gameStore.updateRoom(roomId, room)

    await pusher.trigger(`room-${roomId}`, 'room-update', room)

    return NextResponse.json({ 
      success: true, 
      rounds: playerRounds.map(round => ({
        truth: round.truth,
        lie1: round.lie1,
        lie2: round.lie2
      }))
    })
  } catch (error) {
    console.error('Error generating statements:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate statements' },
      { status: 500 }
    )
  }
}