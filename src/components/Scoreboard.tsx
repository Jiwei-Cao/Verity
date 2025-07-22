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
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
      <h3 className="text-xl font-bold mb-6 text-center text-gray-800 flex items-center justify-center">
        <span className="mr-2">🏆</span>
        Scoreboard
      </h3>
      <div className="space-y-3">
        {room.players.map((player) => {
          const isCurrentGuesser = room.currentGuesser === player.id
          const isCurrentPlayer = room.currentPlayer === player.id
          const isMe = currentPlayer?.id === player.id
          
          return (
            <div 
              key={player.id} 
              className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${
                isMe 
                  ? 'bg-gradient-to-r from-blue-50 via-blue-50 to-purple-50 border-2 border-blue-200 shadow-md' 
                  : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="flex flex-col">
                  <span className={`font-semibold text-base ${isMe ? 'text-blue-800' : 'text-gray-800'}`}>
                    {player.name}
                  </span>
                  {isMe && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1 w-fit">
                      <span className="w-2 h-2 bg-blue-400 rounded-full mr-1"></span>
                      You
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {room.hostId === player.id && (
                    <span className="inline-flex items-center text-xs bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 px-2.5 py-1 rounded-full font-medium border border-yellow-200">
                      <span className="mr-1">👑</span>Host
                    </span>
                  )}
                  {isCurrentGuesser && room.roundPhase === 'playing' && (
                    <span className="inline-flex items-center text-xs bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 px-2.5 py-1 rounded-full font-medium border border-blue-200">
                      <span className="mr-1">🎯</span>Guessing
                    </span>
                  )}
                  {isCurrentPlayer && room.roundPhase === 'playing' && (
                    <span className="inline-flex items-center text-xs bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 px-2.5 py-1 rounded-full font-medium border border-green-200">
                      <span className="mr-1">📝</span>Being Guessed
                    </span>
                  )}
                </div>
              </div>
              <div className={`text-2xl font-bold ${
                isMe ? 'text-blue-600' : 'text-gray-600'
              }`}>
                {scores[player.id] || 0}<span className="text-lg text-gray-400">/5</span>
              </div>
            </div>
          )
        })}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200 text-center">
        <div className="text-sm font-semibold text-gray-700 mb-1">
          Round {room.currentRound} of {room.maxRounds}
        </div>
        <div className={`text-xs font-medium px-3 py-1 rounded-full inline-block ${
          room.roundPhase === 'playing' 
            ? 'bg-green-100 text-green-700' 
            : 'bg-orange-100 text-orange-700'
        }`}>
          {room.roundPhase === 'playing' ? '🎮 Playing' : '⏸️ Intermission'}
        </div>
      </div>
    </div>
  )
}