'use client'

import { useState, useEffect, useCallback } from 'react'
import { GameRoom, Player } from '@/types/game'

interface GameRoundProps {
  room: GameRoom
  currentPlayer: Player
  roomId: string
  onScoreUpdate: () => void
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
    onScoreUpdate()

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
    let baseClass = "p-6 border-2 rounded-xl transition-all duration-300 transform hover:scale-105 min-h-[140px] flex items-center justify-center shadow-lg hover:shadow-xl "
    
    if (!isMyTurn) {
      baseClass += "border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 text-gray-600 cursor-default hover:scale-100"
    } else if (room.roundPhase === 'intermission' || selectedIndex !== null) {
      if (selectedIndex === index) {
        baseClass += isCorrect 
          ? "border-green-400 bg-gradient-to-br from-green-50 to-green-100 text-green-800 shadow-green-200" 
          : "border-red-400 bg-gradient-to-br from-red-50 to-red-100 text-red-800 shadow-red-200"
      } else {
        const statement = shuffledStatements[index]
        const isCorrectCard = statement.originalIndex === currentRound?.truthIndex
        baseClass += isCorrectCard
          ? "border-green-300 bg-gradient-to-br from-green-50 to-green-100 text-green-700 shadow-green-100"
          : "border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100 text-gray-600 shadow-gray-100"
      }
      baseClass += " cursor-default hover:scale-105"
    } else {
      baseClass += "border-blue-200 hover:border-blue-400 bg-gradient-to-br from-white to-blue-50 cursor-pointer hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100 text-gray-800"
    }
    
    return baseClass
  }

  if (!currentRound) {
    return <div>Loading round...</div>
  }

  const playerName = currentPlayerObj?.name || 'Player'

  // Intermission Phase
  if (room.roundPhase === 'intermission') {
    const playerReady = room.playersReady.includes(currentPlayer.id)
    
    return (
      <div className="max-w-5xl mx-auto p-4 sm:p-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">
            🎯 Round {room.currentRound} Results
          </h2>
          <p className="text-base sm:text-lg text-gray-600 mb-4">
            {playerName}&apos;s statements (Set {playerRoundIndex + 1})
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {shuffledStatements.map((statement, index) => (
            <div
              key={index}
              className={getCardClassName(index)}
            >
              <div className="text-center w-full">
                <div className="text-xs sm:text-sm font-bold text-gray-500 mb-3 bg-white bg-opacity-60 px-2 py-1 rounded-full inline-block">
                  Option {index + 1}
                </div>
                <p className="text-sm sm:text-base leading-relaxed mb-4 font-medium">
                  {statement.text}
                </p>
                <div className="text-sm font-bold">
                  {statement.originalIndex === currentRound.truthIndex ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-green-700 bg-green-100 border border-green-200">
                      <span className="mr-1">✓</span> TRUTH
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-red-700 bg-red-100 border border-red-200">
                      <span className="mr-1">✗</span> LIE
                    </span>
                  )}
                </div>
                {selectedIndex === index && (
                  <div className="text-xs font-semibold text-gray-600 mt-2 bg-gray-100 px-2 py-1 rounded-full inline-block">
                    👆 Your guess
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mb-8">
          <div className={`inline-block px-6 py-4 rounded-2xl font-bold text-lg sm:text-xl shadow-lg ${
            (timedOut || (currentRound.timedOut)) ? 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-2 border-gray-300' :
            (isCorrect || currentRound.guessedCorrectly) 
              ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-2 border-green-300' 
              : 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border-2 border-red-300'
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
          <p className="text-sm sm:text-base text-gray-600 mb-6 font-medium">
            Waiting for both players to continue...
          </p>
          <div className="mb-6 flex flex-wrap justify-center gap-3">
            {room.players.map(player => (
              <span key={player.id} className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                room.playersReady.includes(player.id) 
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border-green-300' 
                  : 'bg-gray-50 text-gray-600 border-gray-200'
              }`}>
                <span className="mr-2">{room.playersReady.includes(player.id) ? '✓' : '⏳'}</span>
                {player.name}
              </span>
            ))}
          </div>
          <button
            onClick={handleNextRound}
            disabled={playerReady}
            className={`font-bold px-8 py-4 rounded-xl text-base transition-all duration-300 transform ${
              playerReady 
                ? 'bg-gray-300 text-gray-500 cursor-default' 
                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white hover:scale-105 shadow-lg hover:shadow-xl'
            }`}
          >
            {playerReady ? '⏳ Waiting...' : '➡️ Next Round'}
          </button>
        </div>
      </div>
    )
  }

  // Playing Phase
  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3">
          🎯 Round {room.currentRound}: Pick the truth!
        </h2>
        <p className="text-base sm:text-lg text-gray-600 mb-6">
          {playerName}&apos;s statements (Set {playerRoundIndex + 1})
        </p>
        
        {isMyTurn ? (
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-6 mb-6 shadow-lg">
            <div className={`text-3xl sm:text-4xl font-bold mb-3 ${
              timeLeft <= 10 ? 'text-red-600 animate-pulse' : 'text-blue-600'
            }`}>
              {timeLeft}s
            </div>
            <p className="text-blue-700 font-semibold text-base sm:text-lg">🎮 Your turn to guess!</p>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-2xl p-6 mb-6 shadow-lg">
            <p className="text-gray-600 font-semibold text-base sm:text-lg">
              ⏳ Waiting for {room.players.find(p => p.id === room.currentGuesser)?.name} to guess...
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {shuffledStatements.map((statement, index) => (
          <div
            key={index}
            className={getCardClassName(index)}
            onClick={() => handleCardClick(index)}
          >
            <div className="text-center w-full">
              <div className="text-xs sm:text-sm font-bold text-gray-500 mb-3 bg-white bg-opacity-60 px-2 py-1 rounded-full inline-block">
                Option {index + 1}
              </div>
              <p className="text-sm sm:text-base leading-relaxed font-medium">
                {statement.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}