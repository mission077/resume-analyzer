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
      
      // Send the form data to the back end
      const response = await fetch('/api/resume-builder', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      console.log('Response received from back end:', response)
      
      const data = await response.json()
      console.log('Response data after sending to back end:', data)
      
      if (!data.data) {
        throw new Error('Invalid response format from resume-builder API')
      }
      
      console.log('Data:', data.data.resumeText)

      // Test out our LLM Gemini
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
      console.log('Response received from data analysis:', data2)
      
      // Navigate to analysis page on success
      router.push('/dashboard/analysis')
      
    } catch (error) {
      console.error('Error processing resume:', error)
      // You might want to show an error message to the user here
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <ResumeForm onSubmit={onSubmit} isLoading={isLoading}/>
  )
}

export default page
