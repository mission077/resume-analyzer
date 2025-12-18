import { useState, useEffect, useRef, useCallback } from 'react'
import { LiveFeedback } from '@/services/analysis/liveFeedback'

interface UseLiveFeedbackOptions {
  sectionName: string
  sectionContent: string
  fullResumeContext?: string
  jobContext?: {
    companyName?: string
    jobTitle?: string
    jobDescription?: string
  }
  debounceMs?: number
  enabled?: boolean
}

interface UseLiveFeedbackReturn {
  feedback: LiveFeedback | null
  isLoading: boolean
  error: string | null
  lastUpdated: number | null
}

/**
 * Custom hook for live AI feedback on resume sections
 * Features:
 * - Debounced API calls (default 2 seconds)
 * - Request cancellation
 * - Loading and error states
 * - Minimum content threshold
 */
export function useLiveFeedback({
  sectionName,
  sectionContent,
  fullResumeContext,
  jobContext,
  debounceMs = 2000,
  enabled = true
}: UseLiveFeedbackOptions): UseLiveFeedbackReturn {
  const [feedback, setFeedback] = useState<LiveFeedback | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const fetchFeedback = useCallback(async () => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    // Skip if content is too short (less than 3 characters) and no context
    const trimmedContent = sectionContent?.trim() || ''
    if (trimmedContent.length < 3 && !fullResumeContext) {
      setFeedback(null)
      setIsLoading(false)
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/resume/live-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionName,
          sectionContent: trimmedContent,
          fullResumeContext,
          jobContext
        }),
        signal: abortController.signal
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch feedback: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate feedback')
      }

      setFeedback(data.feedback)
      setLastUpdated(Date.now())
      setError(null)
    } catch (err: any) {
      // Don't set error if request was aborted (user is still typing)
      if (err.name !== 'AbortError') {
        console.error('Error fetching live feedback:', err)
        setError(err.message || 'Failed to fetch feedback')
        setFeedback(null)
      }
    } finally {
      // Only update loading state if this is still the current request
      if (abortControllerRef.current === abortController) {
        setIsLoading(false)
        abortControllerRef.current = null
      }
    }
  }, [sectionName, sectionContent, fullResumeContext, jobContext])

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Don't fetch if disabled
    if (!enabled) {
      return
    }

    // Set up debounced fetch
    timeoutRef.current = setTimeout(() => {
      fetchFeedback()
    }, debounceMs)

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }, [sectionContent, fetchFeedback, debounceMs, enabled])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    feedback,
    isLoading,
    error,
    lastUpdated
  }
}
