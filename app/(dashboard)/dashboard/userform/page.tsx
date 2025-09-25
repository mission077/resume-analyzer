"use client"

import ResumeForm from '@/components/userform/ResumeForm'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

const page = () => {
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()

  const onSubmit = async (formData) => {
    // Send the form data to the back end
    const response = await fetch('/api/resume-builder', {
      method: 'POST',
      body: formData
    })
    console.log('Response received from back end:', response)
    
    const data = await response.json()
    console.log('Response data after sending to back end:', data)
    // router.push('/dashboard/analysis')
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
    const data2 = await response2.json()
    console.log('Response received from data analysis:', data2)
  }
  return (
    <ResumeForm onSubmit={onSubmit} isLoading={isLoading}/>
  )
}

export default page
