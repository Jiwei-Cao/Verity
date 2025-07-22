'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Pusher from 'pusher-js'
import { GameRoom, ChatMessage, Player } from '@/types/game'
import StartGameButton from '@/components/StartGameButton'
import GameRound from '@/components/GameRound'
import Scoreboard from '@/components/Scoreboard'
import MyRoundsPreview from '@/components/MyRoundsPreview'
import TopNavigation from '@/components/TopNavigation'
import { useRouter } from 'next/navigation'

const capitalizePhase = (phase: string): string => {
  return phase.charAt(0).toUpperCase() + phase.slice(1)
}

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
  const [truths, setTruths] = useState(['', '', '', '', ''])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedRounds, setGeneratedRounds] = useState<Array<{truth: string, lie1: string, lie2: string}> | null>(null)
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0)
  const [scores, setScores] = useState<{[playerId: string]: number}>({})
  const [gameStarted, setGameStarted] = useState(false)
  const [isRestarting, setIsRestarting] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const router = useRouter()

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

      channel.bind('player-joined', (data: { player: Player; room: GameRoom }) => {
        setRoom(data.room)
      })

      channel.bind('game-started', (data: { room: GameRoom; message: string }) => {
        setRoom(data.room)
        setGameStarted(true)
        setCurrentRoundIndex(0)
        // Initialize scores
        const initialScores: {[playerId: string]: number} = {}
        data.room.players.forEach(player => {
          initialScores[player.id] = 0
        })
        setScores(initialScores)
      })

      channel.bind('round-started', (data: { room: GameRoom }) => {
        setRoom(data.room)
        setCurrentRoundIndex(data.room.currentRound - 1) // Convert to 0-based for internal tracking
      })

      channel.bind('round-result', (data: { room: GameRoom; isCorrect: boolean; timedOut?: boolean }) => {
        setRoom(data.room)
        if (!data.timedOut && data.isCorrect) {
          // Update score for the guesser
          const guesserId = data.room.currentGuesser
          if (guesserId) {
            setScores(prev => ({
              ...prev,
              [guesserId]: (prev[guesserId] || 0) + 1
            }))
          }
        }
      })

      channel.bind('game-finished', (data: { room: GameRoom }) => {
        setRoom(data.room)
      })

      channel.bind('room-restart', (data: { room: GameRoom; message: string }) => {
        setRoom(data.room)
        setGameStarted(false)
        setCurrentRoundIndex(0)
        setTruths(['', '', '', '', ''])
        setGeneratedRounds(null)
        setScores({})
      })

      channel.bind('player-left', (data: { room: GameRoom; playerName: string; message: string }) => {
        setRoom(data.room)
        setChatMessages(prev => [...prev, {
          id: Date.now().toString(),
          playerId: 'system',
          playerName: 'System',
          message: data.message,
          timestamp: Date.now(),
          isSystem: true
        }])
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
        setRoom(data.room)
        setChatMessages(data.chatMessages || [])
        setHasJoined(true)
        
        // Initialize scores if game is already started
        if (data.room.started) {
          setGameStarted(true)
          const initialScores: {[playerId: string]: number} = {}
          data.room.players.forEach((player: Player) => {
            initialScores[player.id] = 0
          })
          setScores(initialScores)
        }
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
    if (!currentPlayer || !roomId) {
      console.error('Missing currentPlayer or roomId:', { currentPlayer, roomId })
      return
    }
    
    // Check if all truths are filled
    const validTruths = truths.filter(truth => truth.trim() !== '')
    if (validTruths.length !== 5) {
      alert('Please fill in all 5 truths before generating lies.')
      return
    }

    setIsGenerating(true)

    try {
      console.log('Sending request to:', `/api/rooms/${roomId}/generate`)
      console.log('Room ID:', roomId)
      console.log('Player Name:', currentPlayer.name)
      console.log('Available rooms in client state:', room?.id)
      
      const response = await fetch(`/api/rooms/${roomId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          playerName: currentPlayer.name,
          truths: validTruths
        }),
      })
      
      const data = await response.json()
      console.log('API Response:', data)
      
      if (data.success) {
        setGeneratedRounds(data.rounds)
        // Room will be updated via Pusher
      } else {
        console.error('API Error:', data.error)
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to generate statements:', error)
      alert('Failed to generate statements. Please try again.')
    } finally {
      setIsGenerating(false)
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

  const canGenerate = room?.gamePhase === 'generating' && currentPlayer && !currentPlayer.hasGenerated
  const canReview = room?.gamePhase === 'ready' && currentPlayer && currentPlayer.hasGenerated
  const showStartButton = room?.gamePhase === 'ready' && currentPlayer && room?.hostId === currentPlayer.id
  const isPlaying = room?.gamePhase === 'playing' && gameStarted

  const handleScoreUpdate = (isCorrect: boolean) => {
    // Score updates are now handled via Pusher events
  }

  const restartGame = async () => {
    if (!currentPlayer || !room) return
    
    setIsRestarting(true)
    try {
      const response = await fetch(`/api/rooms/${roomId}/restart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      
      const data = await response.json()
      if (!data.success) {
        console.error('Failed to restart game:', data.error)
        alert('Failed to restart game. Please try again.')
      }
    } catch (error) {
      console.error('Error restarting game:', error)
      alert('Failed to restart game. Please try again.')
    } finally {
      setIsRestarting(false)
    }
  }

  const leaveRoom = async () => {
    if (!currentPlayer) return
    
    setIsLeaving(true)
    try {
      const response = await fetch(`/api/rooms/${roomId}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: currentPlayer.id })
      })
      
      const data = await response.json()
      if (data.success) {
        router.push('/')
      } else {
        console.error('Failed to leave room:', data.error)
        alert('Failed to leave room. Please try again.')
      }
    } catch (error) {
      console.error('Error leaving room:', error)
      alert('Failed to leave room. Please try again.')
    } finally {
      setIsLeaving(false)
    }
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <TopNavigation 
        roomId={roomId} 
        currentPlayer={currentPlayer}
        onLeaveRoom={leaveRoom}
      />
      <div className="p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-gray-800 flex items-center">
            <span className="mr-3">🎯</span>
            Verity - Room {roomId}
          </h1>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <p className="text-gray-700 font-semibold text-base sm:text-lg mb-2">
                {isPlaying ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                    🎮 Round {room?.currentRound || 1} of {room?.maxRounds || 10}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                    📊 Phase: {capitalizePhase(room?.gamePhase || '')}
                  </span>
                )}
              </p>
              <p className="text-sm text-gray-600 font-medium">
                {isPlaying && room?.roundPhase === 'playing' ? (
                  room?.currentGuesser === currentPlayer?.id ? 
                    `🎯 Your turn to guess ${room?.players.find(p => p.id === room.currentPlayer)?.name}'s statements` :
                    `⏳ ${room?.players.find(p => p.id === room.currentGuesser)?.name} is guessing your statements`
                ) : isPlaying && room?.roundPhase === 'intermission' ? (
                  '⏸️ Intermission - Review results'
                ) : null}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {room?.players.map((player) => {
                const isMe = currentPlayer?.id === player.id
                return (
                  <div key={player.id} className={`px-3 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                    isMe 
                      ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border-blue-200' 
                      : 'bg-gray-100 text-gray-700 border-gray-200'
                  }`}>
                    <span className="flex items-center space-x-1">
                      <span>{player.name}</span>
                      {player.ready && <span className="text-green-600">✓</span>}
                      {room?.hostId === player.id && <span>👑</span>}
                      {isMe && <span className="text-blue-600 text-xs">(You)</span>}
                      {isPlaying && <span className="text-gray-600 text-xs">({scores[player.id] || 0}/5)</span>}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Scoreboard */}
          {isPlaying && (
            <div className="lg:col-span-1">
              <Scoreboard 
                room={room} 
                scores={scores} 
                currentPlayer={currentPlayer} 
              />
            </div>
          )}
          
          {/* Game Area */}
          <div className={isPlaying ? "lg:col-span-2" : "lg:col-span-3"}>
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-6 text-gray-800 flex items-center">
                <span className="mr-2">🎮</span>
                Game
              </h2>
              
              {showStartButton && room && currentPlayer && (
                <StartGameButton 
                  room={room} 
                  currentPlayer={currentPlayer} 
                  roomId={roomId} 
                />
              )}

              {isPlaying && room?.gamePhase === 'playing' && (
                <GameRound
                  room={room}
                  currentPlayer={currentPlayer!}
                  roomId={roomId}
                  onScoreUpdate={handleScoreUpdate}
                />
              )}

              {room?.gamePhase === 'finished' && (
                <div className="text-center py-8">
                  <h3 className="text-2xl font-bold mb-4">🎉 Game Complete!</h3>
                  <div className="space-y-2 mb-6">
                    {room.players.map(player => (
                      <div key={player.id} className="text-lg">
                        {player.name}: {scores[player.id] || 0}/5
                      </div>
                    ))}
                  </div>
                  <div className="text-lg font-semibold text-blue-600 mb-6">
                    Winner: {room.players.reduce((winner, player) => 
                      (scores[player.id] || 0) > (scores[winner.id] || 0) ? player : winner
                    ).name}!
                  </div>
                  <button
                    onClick={restartGame}
                    disabled={isRestarting}
                    className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-semibold"
                  >
                    {isRestarting ? 'Restarting...' : 'Restart Game'}
                  </button>
                </div>
              )}

              {canGenerate && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Enter 5 Truths About Yourself</h3>
                  {truths.map((truth, index) => (
                    <div key={index} className="mb-3">
                      <input
                        type="text"
                        placeholder={`Truth ${index + 1}...`}
                        value={truth}
                        onChange={(e) => {
                          const newTruths = [...truths]
                          newTruths[index] = e.target.value
                          setTruths(newTruths)
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                  <button
                    onClick={generateStatements}
                    disabled={isGenerating || truths.some(t => !t.trim())}
                    className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg font-semibold"
                  >
                    {isGenerating ? 'Generating Lies...' : 'Generate Lies'}
                  </button>
                  <p className="text-sm text-gray-600 mt-2">
                    Enter 5 true statements, then click to generate believable lies for each
                  </p>

                  {generatedRounds && (
                    <div className="mt-8">
                      <h4 className="text-lg font-semibold mb-4 text-center">Your Generated Rounds</h4>
                      <div className="space-y-4">
                        {generatedRounds.map((round, index) => (
                          <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                            <div className="mb-3">
                              <h5 className="font-medium text-gray-800 text-center">Round {index + 1}</h5>
                            </div>
                            
                            <div className="space-y-3">
                              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                <div className="flex items-start space-x-2">
                                  <span className="font-semibold text-green-700 min-w-0 flex-shrink-0">Truth:</span>
                                  <p className="text-green-800">{round.truth}</p>
                                </div>
                              </div>
                              
                              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <div className="flex items-start space-x-2">
                                  <span className="font-semibold text-red-700 min-w-0 flex-shrink-0">Lie 1:</span>
                                  <p className="text-red-800">{round.lie1}</p>
                                </div>
                              </div>

                              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <div className="flex items-start space-x-2">
                                  <span className="font-semibold text-red-700 min-w-0 flex-shrink-0">Lie 2:</span>
                                  <p className="text-red-800">{round.lie2}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="text-center mt-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-blue-700 font-medium mb-2">
                            ✓ Your rounds are ready!
                          </p>
                          <p className="text-sm text-blue-600">
                            Wait for the host to start the game. During gameplay, your opponent will see these 3 statements mixed together and try to pick the truth.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {canReview && (
                <MyRoundsPreview
                  player={currentPlayer}
                />
              )}
            </div>
          </div>

          {/* Chat */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6 flex flex-col h-auto lg:h-full min-h-[400px] max-h-[600px] lg:max-h-none">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-800 flex items-center flex-shrink-0">
              <span className="mr-2">💬</span>
              Chat
            </h2>
            <div className="flex-1 overflow-y-auto mb-4 border-2 border-gray-200 rounded-xl p-3 space-y-1 bg-gradient-to-b from-gray-50 to-white min-h-0">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`p-1.5 rounded-lg text-sm ${
                  msg.isSystem 
                    ? 'italic text-gray-500 bg-gray-100 text-center' 
                    : 'bg-white border border-gray-200 shadow-sm'
                }`}>
                  {!msg.isSystem ? (
                    <div>
                      <span className="font-semibold text-blue-700">{msg.playerName}:</span>
                      <span className="ml-2 text-gray-800">{msg.message}</span>
                    </div>
                  ) : (
                    <span className="text-gray-600">ℹ️ {msg.message}</span>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2 flex-shrink-0 w-full">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 min-w-0 px-3 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="flex-shrink-0 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-300 text-white px-3 sm:px-4 py-2 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 text-sm"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}