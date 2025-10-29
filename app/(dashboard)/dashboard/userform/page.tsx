"use client"

import ResumeForm from '@/components/userform/ResumeForm'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

const page = () => {
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()

  const onSubmit = async (formData: FormData) => {
    try {
      setIsLoading(true)
      
      // Set loading state in localStorage
      localStorage.setItem('resumeAnalysisLoading', 'true')
      
      // Navigate to loading screen immediately
      router.push('/dashboard/analysis/loading')
      
      // Send the form data to resume-builder API
      const resumeBuilderResponse = await fetch('/api/resume-builder', {
        method: 'POST',
        body: formData
      })
      
      if (!resumeBuilderResponse.ok) {
        throw new Error(`HTTP error! status: ${resumeBuilderResponse.status}`)
      }
      
      const resumeBuilderData = await resumeBuilderResponse.json()
      
      if (!resumeBuilderData.data) {
        throw new Error('Invalid response format from resume-builder API')
      }

      // Check if PDF analysis was completed in one call (only PDF files have analysis)
      if (resumeBuilderData.data.analysis) {
        // PDF PATH: Analysis already completed in resume-builder
        localStorage.setItem('analysisData', JSON.stringify({ analysis: resumeBuilderData.data.analysis }))
      } else {
        // DOCX PATH: Need to call data-analysis API for analysis
        const analysisPayload = {
          resumeText: resumeBuilderData.data.resumeText
        }
        
        const dataAnalysisResponse = await fetch('/api/data-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resumeDetails: analysisPayload })
        })
        
        if (!dataAnalysisResponse.ok) {
          throw new Error(`HTTP error! status: ${dataAnalysisResponse.status}`)
        }
        
        const dataAnalysisResult = await dataAnalysisResponse.json()
        localStorage.setItem('analysisData', JSON.stringify(dataAnalysisResult))
      }
      
      localStorage.setItem('resumeAnalysisLoading', 'false')
      
      // Dispatch custom event for same-tab communication
      window.dispatchEvent(new CustomEvent('loadingComplete'))
      
      // Navigate to analysis page on success
      router.push('/dashboard/analysis')
      
    } catch (error) {
      console.error('Error processing resume:', error)
      localStorage.setItem('resumeAnalysisLoading', 'false')
      router.push('/dashboard/userform')
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <ResumeForm onSubmit={onSubmit} isLoading={isLoading}/>
  )
}

export default page
