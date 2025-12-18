"use client"

import { LiveFeedback } from '@/services/analysis/liveFeedback'
import { X, AlertCircle, CheckCircle2, Info, Loader2, Lightbulb, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'

interface LiveFeedbackModalProps {
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

const statusConfig = {
  alert: {
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: AlertCircle,
    label: 'Needs Attention'
  },
  warning: {
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    icon: AlertCircle,
    label: 'Could Improve'
  },
  safe: {
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: CheckCircle2,
    label: 'Looking Good'
  },
  incomplete: {
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: Info,
    label: 'Getting Started'
  }
}

export function LiveFeedbackModal({
  feedback,
  isLoading,
  sectionName,
  isOpen,
  onClose
}: LiveFeedbackModalProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isOpen || !isMounted) return null

  const displayName = sectionDisplayNames[sectionName] || sectionName

  return createPortal(
    <div 
      className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">AI Feedback</h3>
            <p className="text-sm text-gray-500 mt-1">{displayName} Section</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-9 w-9 p-0 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-500" />
          </Button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-8 py-6 min-h-0" style={{ maxHeight: 'calc(90vh - 180px)' }}>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-12 w-12 text-violet-500 animate-spin mb-4" />
              <p className="text-base text-gray-600 font-medium">Analyzing your content...</p>
              <p className="text-sm text-gray-500 mt-2">This may take a few seconds</p>
            </div>
          ) : feedback ? (
            <div className="space-y-6">
              {/* Status Card */}
              <div className={`rounded-lg border-2 p-6 ${statusConfig[feedback.status].bgColor} ${statusConfig[feedback.status].borderColor}`}>
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-lg ${statusConfig[feedback.status].bgColor} border-2 ${statusConfig[feedback.status].borderColor} flex items-center justify-center`}>
                    {(() => {
                      const Icon = statusConfig[feedback.status].icon;
                      return <Icon className={`h-6 w-6 ${statusConfig[feedback.status].color}`} />;
                    })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-lg font-semibold ${statusConfig[feedback.status].color} mb-2`}>
                      {statusConfig[feedback.status].label}
                    </h4>
                    <p className="text-base text-gray-700 leading-relaxed">
                      {feedback.feedback}
                    </p>
                  </div>
                </div>
              </div>

              {/* Hints */}
              {feedback.hints && feedback.hints.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                      <Lightbulb className="h-5 w-5 text-violet-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">Questions to Consider</h4>
                  </div>
                  <ul className="space-y-3">
                    {feedback.hints.map((hint, index) => (
                      <li key={index} className="text-base text-gray-700 leading-relaxed flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-semibold mt-0.5">
                          {index + 1}
                        </span>
                        <span className="flex-1">{hint}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggestions */}
              {feedback.suggestions && feedback.suggestions.length > 0 && (
                <div className="bg-violet-50 rounded-lg p-6 border border-violet-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-violet-200 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-violet-700" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">Suggestions</h4>
                  </div>
                  <ul className="space-y-3">
                    {feedback.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-base text-gray-700 leading-relaxed flex items-start gap-3">
                        <span className="flex-shrink-0 w-2 h-2 rounded-full bg-violet-500 mt-2.5"></span>
                        <span className="flex-1">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Info className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-base text-gray-600 font-medium">
                Start typing in the {displayName.toLowerCase()} section to get AI feedback
              </p>
            </div>
          )}
        </div>

        {/* Footer - Fixed */}
        <div className="border-t border-gray-200 px-8 py-5 bg-gray-50 rounded-b-xl flex-shrink-0">
          <Button
            onClick={onClose}
            className="w-full bg-violet-600 text-white hover:bg-violet-700 h-11 text-base font-medium rounded-lg"
          >
            Got it
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
