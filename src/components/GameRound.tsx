'use client'

import { useState, useEffect, useCallback } from 'react'
import { GameRoom, Player } from '@/types/game'

interface GameRoundProps {
  room: GameRoom
  currentPlayer: Player
  roomId: string
  onScoreUpdate: (isCorrect: boolean) => void
}

interface ShuffledStatement {
  text: string
  originalIndex: number
}

export default function GameRound({
  room,
  currentPlayer,
  roomId,
  onScoreUpdate
}: GameRoundProps) {
  const [shuffledStatements, setShuffledStatements] = useState<ShuffledStatement[]>([])
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30)
  const [timedOut, setTimedOut] = useState(false)

  const currentPlayerObj = room.players.find(p => p.id === room.currentPlayer)
  // Calculate which set index to use (0-4) for the current player
  const playerRoundIndex = Math.floor((room.currentRound - 1) / 2)
  const currentRound = currentPlayerObj?.rounds?.[playerRoundIndex]
  const isMyTurn = room.currentGuesser === currentPlayer.id

  useEffect(() => {
    if (!currentRound) return
    
    // Shuffle statements on round change
    const shuffled = currentRound.statements.map((text, index) => ({
      text,
      originalIndex: index
    })).sort(() => Math.random() - 0.5)
    
    setShuffledStatements(shuffled)
    setSelectedIndex(null)
    setShowFeedback(false)
    setIsCorrect(false)
    setTimedOut(false)
    
    // Reset timer
    if (room.roundPhase === 'playing' && room.timerStart) {
      const elapsed = Date.now() - room.timerStart
      setTimeLeft(Math.max(0, Math.ceil((room.timerDuration - elapsed) / 1000)))
    } else {
      setTimeLeft(30)
    }
  }, [currentRound, room.currentRound, room.roundPhase, room.timerStart, room.timerDuration])

  const handleTimeout = useCallback(async () => {
    if (!isMyTurn || room.roundPhase !== 'playing') return
    
    setTimedOut(true)
    setShowFeedback(true)
    
    try {
      await fetch(`/api/rooms/${roomId}/timeout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: currentPlayer.id }),
      })
    } catch (error) {
      console.error('Failed to process timeout:', error)
    }
  }, [isMyTurn, room.roundPhase, roomId, currentPlayer.id])

  // Timer countdown
  useEffect(() => {
    if (room.roundPhase !== 'playing' || !isMyTurn || selectedIndex !== null) return

    const interval = setInterval(() => {
      if (room.timerStart) {
        const elapsed = Date.now() - room.timerStart
        const remaining = Math.max(0, Math.ceil((room.timerDuration - elapsed) / 1000))
        setTimeLeft(remaining)
        
        if (remaining <= 0) {
          handleTimeout()
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [room.roundPhase, room.timerStart, room.timerDuration, isMyTurn, selectedIndex, handleTimeout])

  const handleCardClick = async (shuffledIndex: number) => {
    if (selectedIndex !== null || !isMyTurn || room.roundPhase !== 'playing') return

    const selectedStatement = shuffledStatements[shuffledIndex]
    const wasCorrect = selectedStatement.originalIndex === currentRound?.truthIndex
    
    setSelectedIndex(shuffledIndex)
    setIsCorrect(wasCorrect)
    setShowFeedback(true)
    onScoreUpdate(wasCorrect)

    try {
      await fetch(`/api/rooms/${roomId}/guess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          playerId: currentPlayer.id, 
          guess: selectedStatement.originalIndex 
        }),
      })
    } catch (error) {
      console.error('Failed to submit guess:', error)
    }
  }

  const handleNextRound = async () => {
    try {
      await fetch(`/api/rooms/${roomId}/next-round`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: currentPlayer.id }),
      })
    } catch (error) {
      console.error('Failed to advance round:', error)
    }
  }

  const getCardClassName = (index: number) => {
    let baseClass = "p-6 border-2 rounded-lg transition-all duration-200 "
    
    if (!isMyTurn) {
      baseClass += "border-gray-200 bg-gray-50 text-gray-600 cursor-default"
    } else if (room.roundPhase === 'intermission' || selectedIndex !== null) {
      if (selectedIndex === index) {
        baseClass += isCorrect 
          ? "border-green-500 bg-green-50 text-green-800" 
          : "border-red-500 bg-red-50 text-red-800"
      } else {
        const statement = shuffledStatements[index]
        const isCorrectCard = statement.originalIndex === currentRound?.truthIndex
        baseClass += isCorrectCard
          ? "border-green-300 bg-green-50 text-green-700"
          : "border-gray-200 bg-gray-50 text-gray-600"
      }
      baseClass += " cursor-default"
    } else {
      baseClass += "border-gray-200 hover:border-blue-300 bg-white cursor-pointer hover:shadow-md"
    }
    
    return baseClass
  }

  if (!currentRound) {
    return <div>Loading round...</div>
  }

  const correctStatement = currentRound.statements[currentRound.truthIndex]
  const playerName = currentPlayerObj?.name || 'Player'

  // Intermission Phase
  if (room.roundPhase === 'intermission') {
    const playerReady = room.playersReady.includes(currentPlayer.id)
    
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Round {room.currentRound} Results
          </h2>
          <p className="text-lg text-gray-600 mb-4">
            {playerName}&apos;s statements (Set {playerRoundIndex + 1})
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {shuffledStatements.map((statement, index) => (
            <div
              key={index}
              className={getCardClassName(index)}
            >
              <div className="text-center">
                <div className="text-sm font-semibold text-gray-500 mb-2">
                  Option {index + 1}
                </div>
                <p className="text-lg leading-relaxed mb-3">
                  {statement.text}
                </p>
                <div className="text-sm font-semibold">
                  {statement.originalIndex === currentRound.truthIndex ? (
                    <span className="text-green-600">✓ TRUTH</span>
                  ) : (
                    <span className="text-red-600">✗ LIE</span>
                  )}
                </div>
                {selectedIndex === index && (
                  <div className="text-xs text-gray-500 mt-1">
                    Your guess
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mb-6">
          <div className={`inline-block px-6 py-3 rounded-lg font-semibold text-lg ${
            (timedOut || (currentRound.timedOut)) ? 'bg-gray-100 text-gray-800 border border-gray-200' :
            (isCorrect || currentRound.guessedCorrectly) 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {timedOut || currentRound.timedOut ? (
              "⏰ Time's up!"
            ) : (isCorrect || currentRound.guessedCorrectly) ? (
              "🎉 Correct!"
            ) : (
              "❌ Wrong!"
            )}
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600 mb-4">
            Waiting for both players to continue...
          </p>
          <div className="mb-4">
            {room.players.map(player => (
              <span key={player.id} className={`inline-block mx-2 px-3 py-1 rounded-full text-sm ${
                room.playersReady.includes(player.id) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {player.name} {room.playersReady.includes(player.id) ? '✓' : '...'}
              </span>
            ))}
          </div>
          <button
            onClick={handleNextRound}
            disabled={playerReady}
            className={`font-semibold px-8 py-3 rounded-lg transition-colors duration-200 ${
              playerReady 
                ? 'bg-gray-300 text-gray-500 cursor-default' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {playerReady ? 'Waiting...' : 'Next Round'}
          </button>
        </div>
      </div>
    )
  }

  // Playing Phase
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Round {room.currentRound}: Pick the truth!
        </h2>
        <p className="text-lg text-gray-600 mb-4">
          {playerName}&apos;s statements (Set {playerRoundIndex + 1})
        </p>
        
        {isMyTurn ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className={`text-2xl font-bold mb-2 ${timeLeft <= 10 ? 'text-red-600' : 'text-blue-600'}`}>
              {timeLeft}s
            </div>
            <p className="text-blue-700">Your turn to guess!</p>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <p className="text-gray-600">
              Waiting for {room.players.find(p => p.id === room.currentGuesser)?.name} to guess...
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {shuffledStatements.map((statement, index) => (
          <div
            key={index}
            className={getCardClassName(index)}
            onClick={() => handleCardClick(index)}
          >
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-500 mb-2">
                Option {index + 1}
              </div>
              <p className="text-lg leading-relaxed">
                {statement.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}