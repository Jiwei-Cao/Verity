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
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-gray-800">Verity</h1>
          <div className="text-sm text-gray-600">
            Party Code: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{roomId}</span>
          </div>
        </div>
        <button
          onClick={handleLeaveRoom}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Leave Room
        </button>
      </div>
    </div>
  )
}