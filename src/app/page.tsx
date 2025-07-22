'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [roomId, setRoomId] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const router = useRouter()

  const createRoom = async () => {
    setIsCreating(true)
    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
      })
      const data = await response.json()
      router.push(`/room/${data.roomId}`)
    } catch (error) {
      console.error('Failed to create room:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const joinRoom = () => {
    if (roomId.trim()) {
      router.push(`/room/${roomId}`)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full mx-4">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
          Verity
        </h1>
        <p className="text-gray-600 text-center mb-8">
          A game of 2 lies and 1 truth
        </p>
        
        <div className="space-y-4">
          <button
            onClick={createRoom}
            disabled={isCreating}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {isCreating ? 'Creating...' : 'Create New Game'}
          </button>
          
          <div className="text-center text-gray-500">or</div>
          
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Enter room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
            />
            <button
              onClick={joinRoom}
              disabled={!roomId.trim()}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Join Game
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}