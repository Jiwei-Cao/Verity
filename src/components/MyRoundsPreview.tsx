'use client'

import { Player } from '@/types/game'

interface MyRoundsPreviewProps {
  player: Player
}

export default function MyRoundsPreview({ player }: MyRoundsPreviewProps) {
  if (!player.rounds || player.rounds.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No rounds generated yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Your Rounds Preview</h3>
        <p className="text-gray-600 mb-4">
          Review what your opponent will see during the game. Wait for the host to start when both players are ready.
        </p>
      </div>

      <div className="space-y-4">
        {player.rounds.map((round, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="mb-3">
              <h4 className="font-medium text-gray-800 text-center">Round {index + 1}</h4>
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

      <div className="text-center pt-4 border-t border-gray-200">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-700 font-medium mb-2">
            ✓ Your rounds are ready!
          </p>
          <p className="text-sm text-blue-600">
            During the game, your opponent will see these 3 statements mixed together and try to pick the truth.
          </p>
        </div>
      </div>
    </div>
  )
}