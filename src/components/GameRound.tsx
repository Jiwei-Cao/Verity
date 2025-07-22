'use client'

import { useState, useEffect } from 'react'

interface GameRoundProps {
  roundNumber: number
  statements: string[]
  correctIndex: number
  onNextRound: () => void
  onScoreUpdate: (isCorrect: boolean) => void
}

interface ShuffledStatement {
  text: string
  originalIndex: number
}

export default function GameRound({
  roundNumber,
  statements,
  correctIndex,
  onNextRound,
  onScoreUpdate
}: GameRoundProps) {
  const [shuffledStatements, setShuffledStatements] = useState<ShuffledStatement[]>([])
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  useEffect(() => {
    // Shuffle statements on mount/round change
    const shuffled = statements.map((text, index) => ({
      text,
      originalIndex: index
    })).sort(() => Math.random() - 0.5)
    
    setShuffledStatements(shuffled)
    setSelectedIndex(null)
    setShowFeedback(false)
    setIsCorrect(false)
  }, [statements, roundNumber])

  const handleCardClick = (shuffledIndex: number) => {
    if (selectedIndex !== null) return

    const selectedStatement = shuffledStatements[shuffledIndex]
    const wasCorrect = selectedStatement.originalIndex === correctIndex
    
    setSelectedIndex(shuffledIndex)
    setIsCorrect(wasCorrect)
    setShowFeedback(true)
    onScoreUpdate(wasCorrect)
  }

  const getCardClassName = (index: number) => {
    let baseClass = "p-6 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md "
    
    if (selectedIndex === null) {
      baseClass += "border-gray-200 hover:border-blue-300 bg-white"
    } else if (selectedIndex === index) {
      baseClass += isCorrect 
        ? "border-green-500 bg-green-50 text-green-800" 
        : "border-red-500 bg-red-50 text-red-800"
    } else {
      const statement = shuffledStatements[index]
      const isCorrectCard = statement.originalIndex === correctIndex
      baseClass += isCorrectCard
        ? "border-green-300 bg-green-50 text-green-700"
        : "border-gray-200 bg-gray-50 text-gray-600"
    }
    
    if (selectedIndex !== null) {
      baseClass += " cursor-default"
    }
    
    return baseClass
  }

  const correctStatement = statements[correctIndex]

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Round {roundNumber}: Pick the truth!
        </h2>
        <p className="text-gray-600">
          Click on the statement you think is true
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

      {showFeedback && (
        <div className="text-center mb-6">
          <div className={`inline-block px-6 py-3 rounded-lg font-semibold text-lg ${
            isCorrect 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {isCorrect ? (
              "🎉 Correct!"
            ) : (
              <>
                ❌ Wrong! The truth was: "{correctStatement}"
              </>
            )}
          </div>
        </div>
      )}

      {showFeedback && (
        <div className="text-center">
          <button
            onClick={onNextRound}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-8 py-3 rounded-lg transition-colors duration-200"
          >
            Next Round
          </button>
        </div>
      )}
    </div>
  )
}