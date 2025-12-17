"use client"

import { LiveFeedback } from '@/services/analysis/liveFeedback'
import { X, AlertCircle, CheckCircle2, Info, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LiveFeedbackCardProps {
  feedback: LiveFeedback | null
  isLoading: boolean
  sectionName: string
  isOpen: boolean
  onClose: () => void
}

const sectionDisplayNames: Record<string, string> = {
  personalInfo: 'Personal Information',
  experiences: 'Experience',
  education: 'Education',
  projects: 'Projects',
  skills: 'Skills',
  certifications: 'Certifications',
  extracurriculars: 'Extracurriculars'
}

const statusColors = {
  alert: 'border-red-500 bg-red-50',
  warning: 'border-yellow-500 bg-yellow-50',
  safe: 'border-green-500 bg-green-50',
  incomplete: 'border-blue-500 bg-blue-50'
}

const statusIcons = {
  alert: '⚠️',
  warning: '⚠️',
  safe: '✅',
  incomplete: 'ℹ️'
}

export function LiveFeedbackCard({
  feedback,
  isLoading,
  sectionName,
  isOpen,
  onClose
}: LiveFeedbackCardProps) {
  if (!isOpen) return null

  const displayName = sectionDisplayNames[sectionName] || sectionName

  return (
    <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-2xl border-2 border-gray-200 z-50 max-h-[70vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 truncate">AI Feedback</h3>
          <p className="text-xs text-gray-600 truncate">{displayName}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0 flex-shrink-0 ml-2"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 text-violet-500 animate-spin mb-3" />
            <p className="text-xs text-gray-600">Analyzing your content...</p>
          </div>
        ) : feedback ? (
          <div className="space-y-3">
            {/* Status Card */}
            <div className={`rounded-lg border-2 p-3 ${statusColors[feedback.status]}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{statusIcons[feedback.status]}</span>
                <span className="font-semibold text-sm text-gray-900 capitalize">
                  {feedback.status === 'incomplete' ? 'Getting Started' : feedback.status}
                </span>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">
                {feedback.feedback}
              </p>
            </div>

            {/* Hints */}
            {feedback.hints && feedback.hints.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <h4 className="font-semibold text-xs text-gray-900 mb-2 flex items-center gap-1">
                  <span>💡</span>
                  Questions to Consider
                </h4>
                <ul className="space-y-1.5">
                  {feedback.hints.map((hint, index) => (
                    <li key={index} className="text-xs text-gray-700 leading-relaxed flex items-start gap-1.5">
                      <span className="text-violet-500 mt-0.5 flex-shrink-0">•</span>
                      <span>{hint}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggestions */}
            {feedback.suggestions && feedback.suggestions.length > 0 && (
              <div className="bg-violet-50 rounded-lg p-3 border border-violet-200">
                <h4 className="font-semibold text-xs text-gray-900 mb-2 flex items-center gap-1">
                  <span>✨</span>
                  Suggestions
                </h4>
                <ul className="space-y-1.5">
                  {feedback.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-xs text-gray-700 leading-relaxed flex items-start gap-1.5">
                      <span className="text-violet-500 mt-0.5 flex-shrink-0">→</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="text-3xl mb-3">📝</div>
            <p className="text-xs text-gray-600">
              Start typing in the {displayName.toLowerCase()} section to get AI feedback
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
