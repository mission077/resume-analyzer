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
      console.log('🚀 Form submitted - navigating to loading page')
      
      // Navigate to loading screen immediately
      router.push('/dashboard/analysis/loading')
      
      // Send the form data to the back end
      const response = await fetch('/api/resume-builder', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (!data.data) {
        throw new Error('Invalid response format from resume-builder API')
      }

      // Send data to LLM for analysis
      const payload = {
        companyName: data.data.companyName,
        jobTitle: data.data.jobTitle,
        jobDescription: data.data.jobDescription,
        resumeText: data.data.resumeText
      }
      
      const response2 = await fetch('/api/data-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeDetails: payload })
      })
      
      if (!response2.ok) {
        throw new Error(`HTTP error! status: ${response2.status}`)
      }
      
      const data2 = await response2.json()
      console.log('✅ APIs completed - storing data and navigating to analysis')
      
      // Store analysis data and mark loading as complete
      localStorage.setItem('analysisData', JSON.stringify(data2))
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
