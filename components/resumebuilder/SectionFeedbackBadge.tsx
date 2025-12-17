"use client"

import { LiveFeedback } from '@/services/analysis/liveFeedback'
import { AlertCircle, CheckCircle2, Info, Loader2 } from 'lucide-react'

interface SectionFeedbackBadgeProps {
  feedback: LiveFeedback | null
  isLoading: boolean
  onClick: () => void
}

export function SectionFeedbackBadge({
  feedback,
  isLoading,
  onClick
}: SectionFeedbackBadgeProps) {
  if (isLoading) {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
        title="Analyzing..."
      >
        <Loader2 className="h-4 w-4 text-gray-600 animate-spin" />
        <span className="text-xs text-gray-600">Analyzing...</span>
      </button>
    )
  }

  if (!feedback) {
    return null
  }

  const badgeConfig = {
    alert: {
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50 hover:bg-red-100',
      borderColor: 'border-red-200',
      label: 'Needs Attention'
    },
    warning: {
      icon: AlertCircle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 hover:bg-yellow-100',
      borderColor: 'border-yellow-200',
      label: 'Could Improve'
    },
    safe: {
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50 hover:bg-green-100',
      borderColor: 'border-green-200',
      label: 'Looking Good'
    },
    incomplete: {
      icon: Info,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      borderColor: 'border-blue-200',
      label: 'Incomplete'
    }
  }

  const config = badgeConfig[feedback.status]
  const Icon = config.icon

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-colors ${config.bgColor} ${config.borderColor}`}
      title={`Click to view feedback: ${feedback.feedback}`}
    >
      <Icon className={`h-4 w-4 ${config.color}`} />
      <span className={`text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    </button>
  )
}
