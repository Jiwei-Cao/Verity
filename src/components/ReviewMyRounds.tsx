'use client'

import { useState } from 'react'
import { Player, PlayerRound } from '@/types/game'

interface ReviewMyRoundsProps {
  player: Player
  roomId: string
  onReviewToggle: (reviewComplete: boolean) => void
}

export default function ReviewMyRounds({ player, roomId, onReviewToggle }: ReviewMyRoundsProps) {
  const [regenerating, setRegenerating] = useState<number | null>(null)
  const [reviewComplete, setReviewComplete] = useState(player.reviewComplete)

  if (!player.rounds || player.rounds.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No rounds generated yet.</p>
      </div>
    )
  }

  const handleRegenerateLies = async (roundIndex: number, truth: string) => {
    setRegenerating(roundIndex)

    try {
      const response = await fetch(`/api/rooms/${roomId}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: player.name,
          truth,
          roundIndex
        }),
      })

      const data = await response.json()
      if (!data.success) {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to regenerate lies:', error)
      alert('Failed to regenerate lies. Please try again.')
    } finally {
      setRegenerating(null)
    }
  }

  const handleReviewToggle = async () => {
    const newReviewComplete = !reviewComplete
    setReviewComplete(newReviewComplete)

    try {
      const response = await fetch(`/api/rooms/${roomId}/review-complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: player.name,
          reviewComplete: newReviewComplete
        }),
      })

      const data = await response.json()
      if (data.success) {
        onReviewToggle(newReviewComplete)
      } else {
        // Revert on failure
        setReviewComplete(!newReviewComplete)
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to update review status:', error)
      setReviewComplete(!newReviewComplete)
      alert('Failed to update review status. Please try again.')
    }
  }

  const getLiesFromRound = (round: PlayerRound): string[] => {
    return round.statements.filter((_, index) => index !== round.truthIndex)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Review Your Rounds</h3>
        <p className="text-gray-600 mb-4">
          Check your truths and generated lies. You can regenerate lies for any round if needed.
        </p>
      </div>

      <div className="space-y-4">
        {player.rounds.map((round, index) => {
          const lies = getLiesFromRound(round)
          const isRegenerating = regenerating === index

          return (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-gray-800">Round {index + 1}</h4>
                <button
                  onClick={() => handleRegenerateLies(index, round.truth)}
                  disabled={isRegenerating}
                  className={`px-3 py-1 text-sm rounded ${
                    isRegenerating
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {isRegenerating ? 'Regenerating...' : 'Regenerate Lies'}
                </button>
              </div>
              
              <div className="space-y-2">
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <span className="font-semibold text-green-700">Truth:</span>
                  <p className="text-green-800 mt-1">{round.truth}</p>
                </div>
                
                {lies.map((lie, lieIndex) => (
                  <div key={lieIndex} className="bg-red-50 border border-red-200 rounded p-3">
                    <span className="font-semibold text-red-700">Lie {lieIndex + 1}:</span>
                    <p className="text-red-800 mt-1">{lie}</p>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="text-center pt-4 border-t border-gray-200">
        <button
          onClick={handleReviewToggle}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors duration-200 ${
            reviewComplete
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-gray-500 hover:bg-gray-600 text-white'
          }`}
        >
          {reviewComplete ? '✓ Review Complete' : 'Mark as Reviewed'}
        </button>
        <p className="text-xs text-gray-500 mt-2">
          {reviewComplete 
            ? 'You have completed your review. The host can start the game when both players are ready.'
            : 'Click to confirm you have finished reviewing your rounds.'
          }
        </p>
      </div>
    </div>
  )
}