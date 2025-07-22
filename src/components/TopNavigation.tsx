'use client'

import { useRouter } from 'next/navigation'

interface TopNavigationProps {
  roomId: string
  currentPlayer?: { id: string; name: string } | null
  onLeaveRoom?: () => void
}

export default function TopNavigation({ roomId, currentPlayer, onLeaveRoom }: TopNavigationProps) {
  const router = useRouter()

  const handleLeaveRoom = async () => {
    if (onLeaveRoom) {
      onLeaveRoom()
    } else {
      router.push('/')
    }
  }

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm px-4 sm:px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3 sm:space-x-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">🎯 Verity</h1>
          <div className="text-xs sm:text-sm text-gray-600">
            Party Code: <span className="font-mono bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 text-blue-800 px-3 py-1.5 rounded-lg font-semibold">{roomId}</span>
          </div>
        </div>
        <button
          onClick={handleLeaveRoom}
          className="bg-red-500 hover:bg-red-600 active:bg-red-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
        >
          Leave Room
        </button>
      </div>
    </div>
  )
}