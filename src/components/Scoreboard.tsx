'use client'

import { GameRoom, Player } from '@/types/game'

interface ScoreboardProps {
  room: GameRoom
  scores: { [playerId: string]: number }
  currentPlayer?: Player | null
}

export default function Scoreboard({ room, scores, currentPlayer }: ScoreboardProps) {
  if (!room || room.gamePhase !== 'playing') {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
      <h3 className="text-lg font-semibold mb-3 text-center">Scoreboard</h3>
      <div className="space-y-2">
        {room.players.map((player) => {
          const isCurrentGuesser = room.currentGuesser === player.id
          const isCurrentPlayer = room.currentPlayer === player.id
          const isMe = currentPlayer?.id === player.id
          
          return (
            <div 
              key={player.id} 
              className={`flex items-center justify-between p-3 rounded-lg ${
                isMe ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className={`font-medium ${isMe ? 'text-blue-700' : 'text-gray-700'}`}>
                  {player.name}
                  {isMe && ' (You)'}
                </span>
                <div className="flex space-x-1">
                  {room.hostId === player.id && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                      👑 Host
                    </span>
                  )}
                  {isCurrentGuesser && room.roundPhase === 'playing' && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      🎯 Guessing
                    </span>
                  )}
                  {isCurrentPlayer && room.roundPhase === 'playing' && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      📝 Being Guessed
                    </span>
                  )}
                </div>
              </div>
              <div className={`text-xl font-bold ${
                isMe ? 'text-blue-600' : 'text-gray-600'
              }`}>
                {scores[player.id] || 0}/5
              </div>
            </div>
          )
        })}
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-200 text-center">
        <div className="text-sm text-gray-600">
          Round {room.currentRound} of {room.maxRounds}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {room.roundPhase === 'playing' ? 'Playing' : 'Intermission'}
        </div>
      </div>
    </div>
  )
}