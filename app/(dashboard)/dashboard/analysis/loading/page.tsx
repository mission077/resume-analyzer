"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AnalysisLoadingPage() {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const router = useRouter()
  
  const loadingMessages = [
    "We got you covered!",
    "Your resume is being analyzed...",
    "AI is working its magic...",
    "Almost there...",
    "Finalizing your analysis..."
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prevIndex) => 
        (prevIndex + 1) % loadingMessages.length
      )
    }, 3500) // Change message every 3.5 seconds

    return () => clearInterval(interval)
  }, [loadingMessages.length])

  // Auto-redirect to analysis page after a delay (for testing)
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/dashboard/analysis')
    }, 5000) // 5 seconds delay for testing (change to 15000 for real API timing)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md mx-auto px-6">
        {/* Animated Spinner */}
        <div className="relative mb-8">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-violet-200 border-t-violet-500 mx-auto"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Main Title */}
        <h1 className="text-2xl font-bold text-foreground mb-4">
          Analyzing Your Resume
        </h1>

        {/* Animated Message */}
        <div className="h-12 flex items-center justify-center mb-6">
          <p 
            key={currentMessageIndex}
            className="text-lg text-muted-foreground animate-fade-in"
          >
            {loadingMessages[currentMessageIndex]}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Resume uploaded successfully</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Job details processed</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse"></div>
            <span className="text-violet-600 font-medium">AI analysis in progress...</span>
          </div>
        </div>

        {/* Estimated Time */}
        <div className="mt-8 p-4 bg-violet-50 rounded-lg">
          <p className="text-sm text-violet-700">
            ⏱️ This usually takes 10-15 seconds
          </p>
        </div>

        {/* Cancel Button */}
        <div className="mt-6">
          <button 
            onClick={() => router.push('/dashboard/userform')}
            className="text-muted-foreground hover:text-foreground underline"
          >
            Cancel and go back
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-in-out;
        }
      `}</style>
    </div>
  )
}
