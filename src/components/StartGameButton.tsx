'use client'

import { useState } from 'react'
import { GameRoom, Player } from '@/types/game'

interface StartGameButtonProps {
  room: GameRoom
  currentPlayer: Player
  roomId: string
}

export default function StartGameButton({ room, currentPlayer, roomId }: StartGameButtonProps) {
  const [isStarting, setIsStarting] = useState(false)

  const isHost = room.hostId === currentPlayer.id
  const allPlayersReady = room.players.every(p => p.ready)
  const allPlayersReviewed = room.players.every(p => p.reviewComplete)
  const hasEnoughPlayers = room.players.length === 2
  const canStart = isHost && allPlayersReady && allPlayersReviewed && hasEnoughPlayers && !room.started
  
  const handleStartGame = async () => {
    if (!canStart) return

    setIsStarting(true)

    try {
      const response = await fetch(`/api/rooms/${roomId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: currentPlayer.id }),
      })

      const data = await response.json()
      if (!data.success) {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to start game:', error)
      alert('Failed to start game. Please try again.')
    } finally {
      setIsStarting(false)
    }
  }

  const getButtonText = () => {
    if (isStarting) return 'Starting Game...'
    if (!hasEnoughPlayers) return 'Waiting for players...'
    if (!allPlayersReady) return 'Waiting for all players to generate...'
    if (!allPlayersReviewed) return 'Waiting for all players to review...'
    if (room.started) return 'Game Started'
    return 'Start Game'
  }

  const getStatusText = () => {
    if (room.started) return 'Game in progress'
    if (!hasEnoughPlayers) return `Need ${2 - room.players.length} more player(s)`
    if (!allPlayersReady) {
      const notReadyPlayers = room.players.filter(p => !p.ready)
      return `Waiting for generation: ${notReadyPlayers.map(p => p.name).join(', ')}`
    }
    if (!allPlayersReviewed) {
      const notReviewedPlayers = room.players.filter(p => !p.reviewComplete)
      return `Waiting for review: ${notReviewedPlayers.map(p => p.name).join(', ')}`
    }
    return 'Ready to start!'
  }

  if (!isHost) {
    return (
      <div className="text-center py-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-700 font-medium mb-2">
            Waiting for host to start the game
          </p>
          <p className="text-sm text-blue-600">
            Status: {getStatusText()}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="text-center py-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Game Status</h3>
        <div className="flex justify-center space-x-4 mb-4">
          {room.players.map((player) => (
            <div key={player.id} className="text-center">
              <div className="flex space-x-1 justify-center mb-1">
                <div className={`w-2 h-2 rounded-full ${
                  player.ready ? 'bg-green-500' : 'bg-yellow-500'
                }`} title={player.ready ? 'Generated' : 'Not Generated'} />
                <div className={`w-2 h-2 rounded-full ${
                  player.reviewComplete ? 'bg-green-500' : 'bg-yellow-500'
                }`} title={player.reviewComplete ? 'Reviewed' : 'Not Reviewed'} />
              </div>
              <div className="text-xs text-gray-600">{player.name}</div>
              <div className="text-xs">
                {player.ready && player.reviewComplete ? '✅ Ready' : '⏳ Pending'}
              </div>
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-600 mb-4">
          {getStatusText()}
        </p>
      </div>

      <button
        onClick={handleStartGame}
        disabled={!canStart || isStarting}
        className={`px-8 py-3 rounded-lg font-semibold text-lg transition-colors duration-200 ${
          canStart && !isStarting
            ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {getButtonText()}
      </button>
    </div>
  )
}