"use client"

import { LiveFeedback } from '@/services/analysis/liveFeedback'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LiveFeedbackPanelProps {
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

export function LiveFeedbackPanel({
  feedback,
  isLoading,
  sectionName,
  isOpen,
  onClose
}: LiveFeedbackPanelProps) {
  if (!isOpen) return null

  const displayName = sectionDisplayNames[sectionName] || sectionName

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">AI Feedback</h3>
          <p className="text-sm text-gray-600">{displayName}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-violet-200 border-t-violet-500 mb-4"></div>
            <p className="text-sm text-gray-600">Analyzing your content...</p>
          </div>
        ) : feedback ? (
          <div className="space-y-4">
            {/* Status Card */}
            <div className={`rounded-lg border-2 p-4 ${statusColors[feedback.status]}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{statusIcons[feedback.status]}</span>
                <span className="font-semibold text-gray-900 capitalize">
                  {feedback.status === 'incomplete' ? 'Getting Started' : feedback.status}
                </span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                {feedback.feedback}
              </p>
            </div>

            {/* Hints */}
            {feedback.hints && feedback.hints.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-sm text-gray-900 mb-3 flex items-center gap-2">
                  <span>💡</span>
                  Questions to Consider
                </h4>
                <ul className="space-y-2">
                  {feedback.hints.map((hint, index) => (
                    <li key={index} className="text-sm text-gray-700 leading-relaxed flex items-start gap-2">
                      <span className="text-violet-500 mt-1">•</span>
                      <span>{hint}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggestions */}
            {feedback.suggestions && feedback.suggestions.length > 0 && (
              <div className="bg-violet-50 rounded-lg p-4 border border-violet-200">
                <h4 className="font-semibold text-sm text-gray-900 mb-3 flex items-center gap-2">
                  <span>✨</span>
                  Suggestions
                </h4>
                <ul className="space-y-2">
                  {feedback.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm text-gray-700 leading-relaxed flex items-start gap-2">
                      <span className="text-violet-500 mt-1">→</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-4xl mb-4">📝</div>
            <p className="text-sm text-gray-600">
              Start typing in the {displayName.toLowerCase()} section to get AI feedback
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
