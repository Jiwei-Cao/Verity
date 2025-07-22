'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Pusher from 'pusher-js'
import { GameRoom, ChatMessage, Player } from '@/types/game'

export default function RoomPage() {
  const params = useParams()
  const roomId = params.roomId as string
  const [playerName, setPlayerName] = useState('')
  const [hasJoined, setHasJoined] = useState(false)
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null)
  const [room, setRoom] = useState<GameRoom | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [, setPusher] = useState<Pusher | null>(null)

  useEffect(() => {
    if (hasJoined) {
      const pusherInstance = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      })
      setPusher(pusherInstance)

      const channel = pusherInstance.subscribe(`room-${roomId}`)
      
      channel.bind('room-update', (data: GameRoom) => {
        setRoom(data)
      })
      
      channel.bind('chat-message', (data: ChatMessage) => {
        setChatMessages(prev => [...prev, data])
      })

      return () => {
        pusherInstance.unsubscribe(`room-${roomId}`)
        pusherInstance.disconnect()
      }
    }
  }, [roomId, hasJoined])

  const joinGame = async () => {
    if (!playerName.trim()) return

    try {
      const response = await fetch(`/api/rooms/${roomId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: playerName.trim() }),
      })
      
      const data = await response.json()
      if (data.success) {
        setCurrentPlayer(data.player)
        setHasJoined(true)
      }
    } catch (error) {
      console.error('Failed to join room:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentPlayer) return

    try {
      await fetch(`/api/rooms/${roomId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          playerId: currentPlayer.id,
          playerName: currentPlayer.name,
          message: newMessage.trim() 
        }),
      })
      setNewMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const generateStatements = async () => {
    if (!currentPlayer) return

    try {
      const response = await fetch(`/api/rooms/${roomId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          playerId: currentPlayer.id,
          playerName: currentPlayer.name 
        }),
      })
      
      const data = await response.json()
      if (data.success) {
        // Room will be updated via Pusher
      }
    } catch (error) {
      console.error('Failed to generate statements:', error)
    }
  }

  const makeGuess = async (statementIndex: number) => {
    if (!currentPlayer || !room) return

    try {
      await fetch(`/api/rooms/${roomId}/guess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          playerId: currentPlayer.id,
          guess: statementIndex 
        }),
      })
    } catch (error) {
      console.error('Failed to make guess:', error)
    }
  }

  if (!hasJoined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full mx-4">
          <h1 className="text-2xl font-bold text-center mb-6">Join Game</h1>
          <p className="text-gray-600 text-center mb-6">Room: {roomId}</p>
          
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && joinGame()}
            />
            <button
              onClick={joinGame}
              disabled={!playerName.trim()}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-semibold py-3 rounded-lg"
            >
              Join Game
            </button>
          </div>
        </div>
      </div>
    )
  }

  const currentRound = room?.rounds[room.currentRound]
  const canGenerate = room?.gamePhase === 'generating' && currentPlayer && !currentPlayer.hasGenerated
  const canGuess = room?.gamePhase === 'guessing' && currentRound && !currentRound.revealed

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold mb-4">Verity - Room {roomId}</h1>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">Round {(room?.currentRound || 0) + 1} of {room?.maxRounds}</p>
              <p className="text-sm text-gray-500">Phase: {room?.gamePhase}</p>
            </div>
            <div className="flex space-x-2">
              {room?.players.map((player) => (
                <div key={player.id} className="bg-blue-100 px-3 py-1 rounded-full text-sm">
                  {player.name} {player.hasGenerated && '✓'}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Game</h2>
              
              {canGenerate && (
                <div className="mb-6">
                  <button
                    onClick={generateStatements}
                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold"
                  >
                    Generate Your Statements
                  </button>
                  <p className="text-sm text-gray-600 mt-2">
                    Generate 3 statements: 2 lies and 1 truth about yourself
                  </p>
                </div>
              )}

              {currentRound && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    {currentRound.playerName}&apos;s Statements
                  </h3>
                  <div className="space-y-3">
                    {currentRound.statements.map((statement, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <p className="mb-2">{statement}</p>
                        {canGuess && (
                          <button
                            onClick={() => makeGuess(index)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm"
                          >
                            This is the Truth
                          </button>
                        )}
                        {currentRound.revealed && (
                          <div className="mt-2">
                            {index === currentRound.truthIndex ? (
                              <span className="text-green-600 font-semibold">✓ TRUTH</span>
                            ) : (
                              <span className="text-red-600">✗ LIE</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chat */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Chat</h2>
            <div className="h-80 overflow-y-auto mb-4 border rounded p-4 space-y-2">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`${msg.isSystem ? 'italic text-gray-500' : ''}`}>
                  <span className="font-semibold">{msg.playerName}:</span> {msg.message}
                </div>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}